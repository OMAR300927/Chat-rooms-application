"""Conversation and message routes for the AI API."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, Response, status

from ..db.session import db_dependency
from ..schemas.conversations import (
    ConversationCreateRequest,
    ConversationDetailResponse,
    ConversationResponse,
)
from ..schemas.messages import MessageCreateRequest, MessageResponse
from ..services.conversations import (
    ConversationDocumentsError,
    ConversationGenerationError,
    ConversationNotFoundError,
    create_conversation,
    delete_conversation,
    get_conversation,
    list_conversations,
    send_message,
)
from .dependencies import CurrentUserDependency

router = APIRouter(prefix="/conversations", tags=["conversations"])


def _require_ai_access(ai_chat_unlocked: bool) -> None:
    if not ai_chat_unlocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI chat access is not unlocked",
        )


@router.post(
    "",
    response_model=ConversationDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_conversation_route(
    request: ConversationCreateRequest,
    current_user: CurrentUserDependency,
    db: db_dependency,
) -> ConversationDetailResponse:
    """Create a conversation with optional owner-owned documents."""
    _require_ai_access(current_user.ai_chat_unlocked)
    try:
        conversation = await create_conversation(
            db,
            current_user.id,
            title=request.title,
            document_ids=request.document_ids,
        )

    except ConversationDocumentsError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error

    return ConversationDetailResponse.model_validate(conversation)


@router.get("", response_model=list[ConversationResponse])
async def list_conversations_route(
    current_user: CurrentUserDependency,
    db: db_dependency,
) -> list[ConversationResponse]:
    """List conversations belonging to the authenticated user."""
    _require_ai_access(current_user.ai_chat_unlocked)
    conversations = await list_conversations(db, current_user.id)
    return [
        ConversationResponse.model_validate(conversation)
        for conversation in conversations
    ]


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation_route(
    conversation_id: UUID,
    current_user: CurrentUserDependency,
    db: db_dependency,
) -> ConversationDetailResponse:
    """Return an owner's conversation, selected documents, and message history."""
    _require_ai_access(current_user.ai_chat_unlocked)
    try:
        conversation = await get_conversation(db, conversation_id, current_user.id)

    except ConversationNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    return ConversationDetailResponse.model_validate(conversation)


@router.post(
    "/{conversation_id}/messages",
    response_model=list[MessageResponse],
)
async def send_message_route(
    conversation_id: UUID,
    request: MessageCreateRequest,
    current_user: CurrentUserDependency,
    db: db_dependency,
) -> list[MessageResponse]:
    """Save a user message and return it with the generated assistant response."""
    _require_ai_access(current_user.ai_chat_unlocked)
    try:
        messages = await send_message(
            db,
            conversation_id,
            current_user.id,
            request.content,
        )

    except ConversationNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error
    
    except ConversationDocumentsError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error
    
    except ConversationGenerationError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(error),
        ) from error
    
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error

    return [MessageResponse.model_validate(message) for message in messages]


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation_route(
    conversation_id: UUID,
    current_user: CurrentUserDependency,
    db: db_dependency,
) -> Response:
    """Delete an owner's conversation and messages without deleting its documents."""
    _require_ai_access(current_user.ai_chat_unlocked)
    try:
        await delete_conversation(db, conversation_id, current_user.id)
        
    except ConversationNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    return Response(status_code=status.HTTP_204_NO_CONTENT)
