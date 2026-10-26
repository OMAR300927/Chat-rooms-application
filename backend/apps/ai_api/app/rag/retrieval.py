"""Persistent Chroma indexing and owner-scoped similarity search."""

from uuid import UUID

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings

from ..config import settings
from .embeddings import get_embeddings

_COLLECTION_NAME = "ai_documents"
_MAX_RESULTS = 20


def get_vector_store(
    embeddings: Embeddings | None = None,
) -> Chroma:
    """Return the persistent Chroma collection for AI document chunks."""
    return Chroma(
        collection_name=_COLLECTION_NAME,
        embedding_function=embeddings or get_embeddings(),
        persist_directory=str(settings.chroma_persist_directory),
    )


def _document_filter(owner_id: UUID, document_ids: list[UUID]) -> dict[str, object]:
    return {
        "$and": [
            {"owner_id": str(owner_id)},
            {"document_id": {"$in": [str(document_id) for document_id in document_ids]}},
        ]
    }


async def index_documents(
    documents: list[Document],
    document_id: UUID,
    owner_id: UUID,
    *,
    vector_store: Chroma | None = None,
) -> list[str]:
    """Replace a document's vectors with the provided LangChain chunks."""
    if not documents:
        raise ValueError("At least one document chunk is required for indexing")

    store = vector_store or get_vector_store()
    indexed_documents: list[Document] = []
    for document in documents:
        metadata = dict(document.metadata)
        metadata["document_id"] = str(document_id)
        metadata["owner_id"] = str(owner_id)
        indexed_documents.append(
            Document(page_content=document.page_content, metadata=metadata)
        )

    where = _document_filter(owner_id, [document_id])
    await store.adelete(where=where)
    return await store.aadd_documents(indexed_documents)


async def delete_document_vectors(
    document_id: UUID,
    owner_id: UUID,
    *,
    vector_store: Chroma | None = None,
) -> None:
    """Delete vectors for one document, scoped to its owner."""
    store = vector_store or get_vector_store()
    await store.adelete(where=_document_filter(owner_id, [document_id]))


async def retrieve_documents(
    query: str,
    owner_id: UUID,
    document_ids: list[UUID],
    *,
    k: int = 4,
    vector_store: Chroma | None = None,
) -> list[Document]:
    """Search only the selected documents belonging to the specified owner."""
    normalized_query = query.strip()
    if not normalized_query:
        raise ValueError("Retrieval query must not be blank")
    
    if not document_ids:
        return []
    if not 1 <= k <= _MAX_RESULTS:
        raise ValueError(f"Result count must be between 1 and {_MAX_RESULTS}")

    store = vector_store or get_vector_store()
    return await store.asimilarity_search(
        query=normalized_query,
        k=k,
        filter=_document_filter(owner_id, document_ids),
    )
