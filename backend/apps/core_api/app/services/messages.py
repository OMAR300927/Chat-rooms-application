from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select

from ..db.models import ChatMessage, ChatRoom, RoomMembership
from ..db.session import db_dependency
from ..schemas.messages import MessageCreateRequest


class RoomNotFoundError(Exception):
    """Raised when the requested room does not exist."""


class RoomMembershipRequiredError(Exception):
    """Raised when a user is not a member of the requested room."""


async def _require_room_membership(
    room_id: UUID,
    user_id: UUID,
    db: db_dependency,
) -> None:
    if await db.get(ChatRoom, room_id) is None:
        raise RoomNotFoundError("Room not found")

    result = await db.execute(
        select(RoomMembership.id)
        .where(
            RoomMembership.room_id == room_id,
            RoomMembership.user_id == user_id,
        )
        .limit(1)
    )
    if result.scalar_one_or_none() is None:
        raise RoomMembershipRequiredError("User is not a member of this room")


async def create_message(
    room_id: UUID,
    author_id: UUID,
    message_data: MessageCreateRequest,
    db: db_dependency,
) -> ChatMessage:
    """Create a message if its author belongs to the room."""
    await _require_room_membership(room_id, author_id, db)

    content = message_data.content.strip()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message content must not be blank",
        )

    message = ChatMessage(room_id=room_id, author_id=author_id, content=content)
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message


async def list_room_messages(
    room_id: UUID,
    user_id: UUID,
    db: db_dependency,
    *,
    limit: int = 50,
    offset: int = 0,
) -> list[ChatMessage]:
    """Return a page of room messages in chronological order for a member."""
    await _require_room_membership(room_id, user_id, db)
    if not 1 <= limit <= 100:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message limit must be between 1 and 100",
        )
    if offset < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message offset must not be negative",
        )

    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.room_id == room_id)
        .order_by(ChatMessage.created_at.desc(), ChatMessage.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(reversed(result.scalars().all()))
