"""Document upload and management routes for the AI API."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, File, HTTPException, Response, UploadFile, status

from ..db.session import db_dependency
from ..schemas.documents import DocumentResponse
from ..services.documents import (
    DocumentNotFoundError,
    DocumentProcessingError,
    DocumentStorageError,
    DocumentTooLargeError,
    InvalidDocumentError,
    delete_document,
    get_document,
    list_documents,
    upload_document,
)
from .dependencies import CurrentUserDependency

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document_route(
    current_user: CurrentUserDependency,
    db: db_dependency,
    file: Annotated[UploadFile, File(description="PDF document to upload")],
) -> DocumentResponse:
    """Upload, process, and index a PDF for the authenticated user."""
    try:
        document = await upload_document(db, current_user.id, file)

    except DocumentTooLargeError as error:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=str(error),
        ) from error
    
    except InvalidDocumentError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error
    
    except DocumentProcessingError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to process the uploaded PDF",
        ) from error
    
    except DocumentStorageError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error

    return DocumentResponse.model_validate(document)


@router.get("", response_model=list[DocumentResponse])
async def list_documents_route(
    current_user: CurrentUserDependency,
    db: db_dependency,
) -> list[DocumentResponse]:
    """List documents belonging to the authenticated user."""
    documents = await list_documents(db, current_user.id)
    return [DocumentResponse.model_validate(document) for document in documents]


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document_route(
    document_id: UUID,
    current_user: CurrentUserDependency,
    db: db_dependency,
) -> DocumentResponse:
    """Return a document belonging to the authenticated user."""
    try:
        document = await get_document(db, document_id, current_user.id)

    except DocumentNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    return DocumentResponse.model_validate(document)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document_route(
    document_id: UUID,
    current_user: CurrentUserDependency,
    db: db_dependency,
) -> Response:
    """Delete a document belonging to the authenticated user."""
    try:
        await delete_document(db, document_id, current_user.id)

    except DocumentNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error
    
    except DocumentStorageError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error

    return Response(status_code=status.HTTP_204_NO_CONTENT)
