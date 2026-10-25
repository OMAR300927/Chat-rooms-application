"""Chat room routes for the Core API."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from ..db.session import db_dependency
from ..routes.auth import CurrentUserDependency
from ..schemas.rooms import RoomCreateRequest, RoomResponse
from ..services.rooms import (
    AlreadyRoomMemberError,
    RoomMembershipNotFoundError,
    RoomNotFoundError,
    create_room,
    get_room_by_id,
    join_room,
    leave_room,
    list_rooms,
)

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post(
    "",
    response_model=RoomResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_room_route(
    room_data: RoomCreateRequest,
    current_user: CurrentUserDependency,
    db: db_dependency,
) -> RoomResponse:
    """Create a room and make the authenticated user its first member."""
    room = await create_room(room_data, current_user.id, db)
    return RoomResponse.model_validate(room)


@router.get("", response_model=list[RoomResponse])
async def list_rooms_route(
    current_user: CurrentUserDependency,
    db: db_dependency,
) -> list[RoomResponse]:
    """List available chat rooms for an authenticated user."""
    rooms = await list_rooms(db)
    return [RoomResponse.model_validate(room) for room in rooms]


@router.get("/{room_id}", response_model=RoomResponse)
async def get_room_route(
    room_id: UUID,
    current_user: CurrentUserDependency,
    db: db_dependency,
) -> RoomResponse:
    """Return a room by ID."""
    room = await get_room_by_id(room_id, db)
    if room is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )
    return RoomResponse.model_validate(room)


@router.post(
    "/{room_id}/join",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def join_room_route(
    room_id: UUID,
    current_user: CurrentUserDependency,
    db: db_dependency,
) -> None:
    """Join the selected room."""
    try:
        await join_room(room_id, current_user.id, db)

    except RoomNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error
    
    except AlreadyRoomMemberError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error


@router.delete(
    "/{room_id}/leave",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def leave_room_route(
    room_id: UUID,
    current_user: CurrentUserDependency,
    db: db_dependency,
) -> None:
    """Leave the selected room."""
    try:
        await leave_room(room_id, current_user.id, db)
        
    except RoomMembershipNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error
