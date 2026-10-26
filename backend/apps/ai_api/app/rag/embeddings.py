"""LangChain Gemini embeddings for document and query vectors."""

from langchain_google_genai import GoogleGenerativeAIEmbeddings

from ..config import settings


class EmbeddingConfigurationError(Exception):
    """Raised when Gemini embeddings are not configured."""


def get_embeddings() -> GoogleGenerativeAIEmbeddings:
    """Create the configured LangChain Gemini embedding client."""
    if settings.gemini_api_key is None:
        raise EmbeddingConfigurationError("GEMINI_API_KEY is not configured")

    return GoogleGenerativeAIEmbeddings(
        model=settings.gemini_embedding_model,
        api_key=settings.gemini_api_key,
    )
