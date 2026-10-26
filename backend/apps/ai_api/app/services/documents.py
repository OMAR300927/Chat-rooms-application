"""Document upload, processing, and ownership-scoped persistence."""

from pathlib import Path
from uuid import UUID, uuid4

from fastapi import UploadFile
from sqlalchemy import select

from ..config import settings
from ..db.models import Document, DocumentStatus
from ..db.session import db_dependency
from ..rag.pdf import load_pdf
from ..rag.retrieval import (
    delete_document_vectors,
    index_documents,
)

_UPLOAD_CHUNK_SIZE = 64 * 1024


class DocumentServiceError(Exception):
    """Base exception for document service operations."""


class DocumentNotFoundError(DocumentServiceError):
    """Raised when a document does not exist for the specified owner."""


class InvalidDocumentError(DocumentServiceError):
    """Raised when an upload is not a supported PDF file."""


class DocumentTooLargeError(InvalidDocumentError):
    """Raised when an uploaded PDF exceeds the configured size limit."""


class DocumentProcessingError(DocumentServiceError):
    """Raised when extracting or indexing a document fails."""


class DocumentStorageError(DocumentServiceError):
    """Raised when an uploaded document cannot be stored or removed."""


def _original_filename(filename: str | None) -> str:
    if not filename:
        raise InvalidDocumentError("A PDF filename is required")

    safe_name = filename.replace("\\", "/").rsplit("/", maxsplit=1)[-1].strip()
    if not safe_name or Path(safe_name).suffix.casefold() != ".pdf":
        raise InvalidDocumentError("Only PDF files are supported")
    
    if len(safe_name) > 255:
        raise InvalidDocumentError("Filename must be 255 characters or fewer")
    
    return safe_name


def _document_path(storage_path: str) -> Path:
    upload_directory = settings.upload_directory.resolve()
    path = Path(storage_path).resolve()

    if not path.is_relative_to(upload_directory):
        raise DocumentStorageError(
            "Document storage path is outside the configured upload directory"
        )
    
    return path


async def _save_upload(upload: UploadFile, path: Path) -> None:
    max_size_bytes = settings.max_pdf_size_mb * 1024 * 1024
    total_bytes = 0
    created = False
    complete = False

    try:
        await upload.seek(0)
        with path.open("xb") as destination:
            created = True

            while chunk := await upload.read(_UPLOAD_CHUNK_SIZE):
                total_bytes += len(chunk)

                if total_bytes > max_size_bytes:
                    raise DocumentTooLargeError(
                        f"PDF exceeds the {settings.max_pdf_size_mb} MB upload limit"
                    )
                destination.write(chunk)

            if total_bytes == 0:
                raise InvalidDocumentError("The uploaded PDF is empty")
        complete = True

    finally:
        if created and not complete:
            path.unlink(missing_ok=True)


async def get_document(
    db: db_dependency,
    document_id: UUID,
    owner_id: UUID,
) -> Document:
    """Return a document only when it belongs to the requested owner."""
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.owner_id == owner_id,
        )
    )
    document = result.scalar_one_or_none()

    if document is None:
        raise DocumentNotFoundError("Document was not found")
    
    return document


async def list_documents(db: db_dependency, owner_id: UUID) -> list[Document]:
    """List the current owner's documents, newest first."""
    result = await db.execute(
        select(Document)
        .where(Document.owner_id == owner_id)
        .order_by(Document.created_at.desc())
    )
    return list(result.scalars().all())


async def process_document(
    db: db_dependency,
    document_id: UUID,
    owner_id: UUID,
) -> Document:
    """Extract and index a stored PDF, updating its lifecycle status."""
    document = await get_document(db, document_id, owner_id)
    if document.status not in (DocumentStatus.UPLOADED, DocumentStatus.FAILED):
        raise DocumentServiceError(
            f"Cannot process a document with status '{document.status.value}'"
        )

    document.status = DocumentStatus.PROCESSING
    await db.commit()

    try:
        pages = await load_pdf(_document_path(document.storage_path))
        await index_documents(pages, document.id, document.owner_id)

    except Exception as error:
        await db.rollback()
        failed_document = await db.get(Document, document_id)

        if failed_document is not None:
            failed_document.status = DocumentStatus.FAILED
            await db.commit()

        raise DocumentProcessingError("Unable to process the uploaded PDF") from error

    document.status = DocumentStatus.READY
    await db.commit()
    return document


async def upload_document(
    db: db_dependency,
    owner_id: UUID,
    upload: UploadFile,
) -> Document:
    """Persist, process, and index one PDF upload for its owner."""
    filename = _original_filename(upload.filename)
    upload_directory = settings.upload_directory.resolve()
    upload_directory.mkdir(parents=True, exist_ok=True)

    document_id = uuid4()
    storage_path = upload_directory / f"{document_id}.pdf"
    await _save_upload(upload, storage_path)

    document = Document(
        id=document_id,
        owner_id=owner_id,
        filename=filename,
        storage_path=str(storage_path),
        status=DocumentStatus.UPLOADED,
    )
    db.add(document)

    try:
        await db.commit()

    except Exception:
        await db.rollback()
        storage_path.unlink(missing_ok=True)
        raise

    return await process_document(db, document_id, owner_id)


async def delete_document(
    db: db_dependency,
    document_id: UUID,
    owner_id: UUID,
) -> None:
    """Delete a document's vectors, database record, and stored PDF."""
    document = await get_document(db, document_id, owner_id)
    storage_path = _document_path(document.storage_path)

    await delete_document_vectors(document.id, document.owner_id)
    await db.delete(document)
    await db.commit()

    try:
        storage_path.unlink(missing_ok=True)
        
    except OSError as error:
        raise DocumentStorageError(
            "Document record was deleted, but its uploaded file could not be removed"
        ) from error
