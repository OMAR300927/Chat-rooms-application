from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select

from ..db.models import ChatRoom, RoomMembership
from ..db.session import db_dependency
from ..schemas.rooms import RoomCreateRequest


class RoomNotFoundError(Exception):
    """Raised when the requested room does not exist."""


class AlreadyRoomMemberError(Exception):
    """Raised when a user is already a member of the room."""


class RoomMembershipNotFoundError(Exception):
    """Raised when a user is not a member of the room."""


async def create_room(
    room_data: RoomCreateRequest,
    created_by_user_id: UUID,
    db: db_dependency,
) -> ChatRoom:
    """Create a room and add its creator as the first member."""
    name = room_data.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Room name must not be blank",
        )

    room = ChatRoom(name=name, created_by_user_id=created_by_user_id)
    db.add(room)
    await db.flush()
    
    db.add(RoomMembership(room_id=room.id, user_id=created_by_user_id))
    await db.commit()
    await db.refresh(room)
    return room


async def get_room_by_id(room_id: UUID, db: db_dependency) -> ChatRoom | None:
    """Return a room by ID, or None if it does not exist."""
    return await db.get(ChatRoom, room_id)


async def list_rooms(db: db_dependency) -> list[ChatRoom]:
    """Return all rooms, newest first."""
    result = await db.execute(select(ChatRoom).order_by(ChatRoom.created_at.desc()))
    return list(result.scalars().all())


async def is_room_member(
    room_id: UUID,
    user_id: UUID,
    db: db_dependency,
) -> bool:
    """Return whether the user is a member of the room."""
    result = await db.execute(
        select(RoomMembership.id)
        .where(
            RoomMembership.room_id == room_id,
            RoomMembership.user_id == user_id,
        )
        .limit(1)
    )
    return result.scalar_one_or_none() is not None


async def join_room(
    room_id: UUID,
    user_id: UUID,
    db: db_dependency,
) -> RoomMembership:
    """Add a user to an existing room."""
    if await db.get(ChatRoom, room_id) is None:
        raise RoomNotFoundError("Room not found")

    existing_membership = await db.execute(
        select(RoomMembership.id)
        .where(
            RoomMembership.room_id == room_id,
            RoomMembership.user_id == user_id,
        )
        .limit(1)
    )
    if existing_membership.scalar_one_or_none() is not None:
        raise AlreadyRoomMemberError("User is already a member of this room")

    membership = RoomMembership(room_id=room_id, user_id=user_id)
    db.add(membership)
    await db.commit()
    await db.refresh(membership)
    return membership


async def leave_room(room_id: UUID, user_id: UUID, db: db_dependency) -> None:
    """Remove a user from a room they belong to."""
    result = await db.execute(
        select(RoomMembership).where(
            RoomMembership.room_id == room_id,
            RoomMembership.user_id == user_id,
        )
    )
    membership = result.scalar_one_or_none()
    if membership is None:
        raise RoomMembershipNotFoundError("User is not a member of this room")

    await db.delete(membership)
    await db.commit()
