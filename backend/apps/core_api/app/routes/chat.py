"""HTTP and WebSocket chat routes for the Core API."""

import asyncio
from json import JSONDecodeError
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from pydantic import ValidationError

from ..config import settings
from ..db.models import ChatRoom
from ..db.session import db_dependency
from ..routes.auth import CurrentUserDependency
from ..schemas.messages import MessageCreateRequest, MessageResponse
from ..security.auth import ACCESS_TOKEN_COOKIE_NAME, decode_access_token
from ..services.messages import (
    RoomMembershipRequiredError,
    RoomNotFoundError,
    create_message,
    list_room_messages,
)
from ..services.rooms import is_room_member
from ..services.users import get_user_by_id

router = APIRouter(prefix="/chat", tags=["chat"])


class RoomConnectionManager:
    """Track and broadcast to WebSocket clients connected in this process."""

    def __init__(self) -> None:
        self._connections: dict[UUID, set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, room_id: UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.setdefault(room_id, set()).add(websocket)

    async def disconnect(self, room_id: UUID, websocket: WebSocket) -> None:
        async with self._lock:
            room_connections = self._connections.get(room_id)

            if room_connections is None:
                return
            
            room_connections.discard(websocket)
            if not room_connections:
                del self._connections[room_id]

    async def broadcast(self, room_id: UUID, message: MessageResponse) -> None:
        async with self._lock:
            connections = tuple(self._connections.get(room_id, ()))

        payload = message.model_dump(mode="json")
        disconnected: list[WebSocket] = []
        for connection in connections:
            try:
                await connection.send_json(payload)
            except WebSocketDisconnect:
                disconnected.append(connection)

        for connection in disconnected:
            await self.disconnect(room_id, connection)


connection_manager = RoomConnectionManager()


@router.get(
    "/rooms/{room_id}/messages",
    response_model=list[MessageResponse],
)
async def get_room_messages(
    room_id: UUID,
    current_user: CurrentUserDependency,
    db: db_dependency,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[MessageResponse]:
    """Get chronological, paginated message history for a room member."""
    try:
        messages = await list_room_messages(
            room_id,
            current_user.id,
            db,
            limit=limit,
            offset=offset,
        )

    except RoomNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error
    
    except RoomMembershipRequiredError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error),
        ) from error
    
    return [MessageResponse.model_validate(message) for message in messages]


@router.post(
    "/rooms/{room_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def post_room_message(
    room_id: UUID,
    message_data: MessageCreateRequest,
    current_user: CurrentUserDependency,
    db: db_dependency,
) -> MessageResponse:
    """Create a room message as the authenticated user."""
    try:
        message = await create_message(
            room_id,
            current_user.id,
            message_data,
            db,
        )

    except RoomNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error
    
    except RoomMembershipRequiredError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error),
        ) from error
    
    return MessageResponse.model_validate(message)


@router.websocket("/rooms/{room_id}/ws")
async def room_chat_websocket(
    websocket: WebSocket,
    room_id: UUID,
    db: db_dependency,
) -> None:
    """Accept cookie-authenticated room messages and broadcast them to peers."""
    origin = websocket.headers.get("origin")
    if origin is not None and origin not in settings.cors_origins:
        await websocket.close(code=4403, reason="Origin not allowed")
        return

    access_token = websocket.cookies.get(ACCESS_TOKEN_COOKIE_NAME)
    user_id = decode_access_token(access_token) if access_token else None
    user = await get_user_by_id(user_id, db) if user_id is not None else None

    if user is None or not user.is_active:
        await websocket.close(code=4401, reason="Authentication required")
        return

    room = await db.get(ChatRoom, room_id)
    if room is None:
        await websocket.close(code=4404, reason="Room not found")
        return

    if not await is_room_member(room_id, user.id, db):
        await websocket.close(code=4403, reason="Room membership required")
        return

    await connection_manager.connect(room_id, websocket)
    try:
        while True:
            raw_message = await websocket.receive_text()
            try:
                message_data = MessageCreateRequest.model_validate_json(raw_message)

            except (ValidationError, JSONDecodeError):
                await websocket.send_json({"error": "Invalid message payload"})
                continue

            try:
                message = await create_message(
                    room_id,
                    user.id,
                    message_data,
                    db,
                )

            except HTTPException as error:
                await websocket.send_json({"error": error.detail})
                continue

            await connection_manager.broadcast(
                room_id,
                MessageResponse.model_validate(message),
            )

    except WebSocketDisconnect:
        pass

    finally:
        await connection_manager.disconnect(room_id, websocket)
