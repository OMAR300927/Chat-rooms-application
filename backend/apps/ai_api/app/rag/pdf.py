"""PDF validation and text extraction for the AI retrieval pipeline."""

import asyncio
from pathlib import Path

from langchain_core.documents import Document as LangChainDocument
from pypdf import PdfReader
from pypdf.errors import PdfReadError

from ..config import settings


class PDFProcessingError(Exception):
    """Raised when an uploaded PDF cannot be safely read or processed."""


def _load_pdf_pages(path: Path) -> list[LangChainDocument]:
    upload_directory = settings.upload_directory.resolve()
    try:
        resolved_path = path.resolve(strict=True)
        if not resolved_path.is_relative_to(upload_directory):
            raise PDFProcessingError(
                "PDF must be located inside the configured upload directory"
            )
        
        if not resolved_path.is_file():
            raise PDFProcessingError("PDF path does not identify a file")
        
        if resolved_path.suffix.casefold() != ".pdf":
            raise PDFProcessingError("Only PDF files are supported")

        max_size_bytes = settings.max_pdf_size_mb * 1024 * 1024
        file_size = resolved_path.stat().st_size
        if file_size > max_size_bytes:
            raise PDFProcessingError(
                f"PDF exceeds the {settings.max_pdf_size_mb} MB upload limit"
            )

        with resolved_path.open("rb") as pdf_file:
            if pdf_file.read(5) != b"%PDF-":
                raise PDFProcessingError("File does not have a valid PDF header")
            
            pdf_file.seek(0)
            reader = PdfReader(pdf_file)
            if reader.is_encrypted:
                raise PDFProcessingError("Encrypted PDFs are not supported")

            documents = []
            for page_number, page in enumerate(reader.pages, start=1):
                text = (page.extract_text() or "").strip()
                if text:
                    documents.append(
                        LangChainDocument(
                            page_content=text,
                            metadata={
                                "source": resolved_path.name,
                                "page": page_number,
                            },
                        )
                    )
    except FileNotFoundError as error:
        raise PDFProcessingError("PDF file does not exist") from error
    
    except OSError as error:
        raise PDFProcessingError("Unable to read PDF file") from error
    
    except PdfReadError as error:
        raise PDFProcessingError("PDF file is malformed or unreadable") from error

    if not documents:
        raise PDFProcessingError("PDF contains no extractable text")
    return documents


async def load_pdf(path: str | Path) -> list[LangChainDocument]:
    """Extract non-empty pages from an uploaded PDF as LangChain documents.

    This function is asynchronous so PDF parsing runs outside the event loop.
    Each returned document contains the source filename and one-based page
    number in its metadata.
    """
    return await asyncio.to_thread(_load_pdf_pages, Path(path))
