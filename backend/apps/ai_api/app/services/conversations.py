"""Conversation persistence and retrieval-augmented message handling."""

from uuid import UUID, uuid4

from langchain_core.documents import Document as LangChainDocument
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..db.models import (
    Conversation,
    ConversationMessage,
    Document,
    DocumentStatus,
    MessageRole,
    utc_now,
)
from ..db.session import db_dependency
from ..rag.answers import generate_answer
from ..rag.retrieval import retrieve_documents

_MAX_MESSAGE_LENGTH = 20_000


class ConversationServiceError(Exception):
    """Base exception for conversation service operations."""


class ConversationNotFoundError(ConversationServiceError):
    """Raised when a conversation does not exist for the specified owner."""


class ConversationDocumentsError(ConversationServiceError):
    """Raised when selected documents are missing, unowned, or not ready."""


class ConversationGenerationError(ConversationServiceError):
    """Raised when retrieval or answer generation fails."""


async def get_conversation(
    db: db_dependency,
    conversation_id: UUID,
    owner_id: UUID,
) -> Conversation:
    """Return a conversation and its detail only to its owner."""
    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.id == conversation_id,
            Conversation.owner_id == owner_id,
        )
        .options(
            selectinload(Conversation.documents),
            selectinload(Conversation.messages),
        )
    )
    conversation = result.scalar_one_or_none()
    
    if conversation is None:
        raise ConversationNotFoundError("Conversation was not found")
    
    return conversation


async def list_conversations(
    db: db_dependency,
    owner_id: UUID,
) -> list[Conversation]:
    """List the owner's conversations, most recently active first."""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.owner_id == owner_id)
        .order_by(Conversation.updated_at.desc())
    )
    return list(result.scalars().all())


async def create_conversation(
    db: db_dependency,
    owner_id: UUID,
    *,
    title: str | None = None,
    document_ids: list[UUID] | None = None,
) -> Conversation:
    """Create a conversation with optional ready documents owned by the user."""
    normalized_title = title.strip() if title else None
    normalized_title = normalized_title or None
    if normalized_title is not None and len(normalized_title) > 255:
        raise ValueError("Conversation title must be 255 characters or fewer")

    selected_ids = list(dict.fromkeys(document_ids or []))
    selected_documents: list[Document] = []
    if selected_ids:
        result = await db.execute(
            select(Document).where(
                Document.id.in_(selected_ids),
                Document.owner_id == owner_id,
                Document.status == DocumentStatus.READY,
            )
        )
        selected_documents = list(result.scalars().all())

        if {document.id for document in selected_documents} != set(selected_ids):
            raise ConversationDocumentsError(
                "One or more selected documents are unavailable or not ready"
            )

    conversation = Conversation(
        id=uuid4(),
        owner_id=owner_id,
        title=normalized_title,
        documents=selected_documents,
    )
    db.add(conversation)
    await db.commit()
    return await get_conversation(db, conversation.id, owner_id)


async def send_message(
    db: db_dependency,
    conversation_id: UUID,
    owner_id: UUID,
    content: str,
) -> tuple[ConversationMessage, ConversationMessage]:
    """Persist a user message, retrieve context, and persist the AI response.

    The user message is committed before calling retrieval or the LLM so it is
    retained if an external generation step fails.
    """
    normalized_content = content.strip()
    if not normalized_content:
        raise ValueError("Message content must not be blank")
    
    if len(normalized_content) > _MAX_MESSAGE_LENGTH:
        raise ValueError(
            f"Message content must be {_MAX_MESSAGE_LENGTH} characters or fewer"
        )

    conversation = await get_conversation(db, conversation_id, owner_id)
    if any(
        document.status != DocumentStatus.READY
        for document in conversation.documents
    ):
        raise ConversationDocumentsError(
            "All selected documents must be ready before sending a message"
        )

    user_message = ConversationMessage(
        id=uuid4(),
        conversation_id=conversation.id,
        role=MessageRole.USER,
        content=normalized_content,
    )
    conversation.updated_at = utc_now()
    conversation.messages.append(user_message)
    await db.commit()

    try:
        document_ids = [document.id for document in conversation.documents]
        retrieved_documents: list[LangChainDocument] = []
        if document_ids:
            retrieved_documents = await retrieve_documents(
                normalized_content,
                owner_id,
                document_ids,
            )
        answer = await generate_answer(normalized_content, retrieved_documents)
        
    except Exception as error:
        raise ConversationGenerationError(
            "Unable to retrieve context or generate an answer"
        ) from error

    assistant_message = ConversationMessage(
        id=uuid4(),
        conversation_id=conversation.id,
        role=MessageRole.ASSISTANT,
        content=answer,
    )
    conversation.updated_at = utc_now()
    conversation.messages.append(assistant_message)
    await db.commit()
    return user_message, assistant_message


async def delete_conversation(
    db: db_dependency,
    conversation_id: UUID,
    owner_id: UUID,
) -> None:
    """Delete an owner's conversation and its messages, preserving documents."""
    conversation = await get_conversation(db, conversation_id, owner_id)
    await db.delete(conversation)
    await db.commit()
