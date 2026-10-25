"""Authentication routes for the Core API."""

from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status

from ..db.models import User
from ..db.session import db_dependency
from ..schemas.auth import LoginRequest, RegisterRequest
from ..schemas.users import UserResponse
from ..security.auth import (
    ACCESS_TOKEN_COOKIE_NAME,
    clear_access_token_cookie,
    create_access_token,
    decode_access_token,
    set_access_token_cookie,
)
from ..services.users import (
    UserAlreadyExistsError,
    authenticate_user,
    create_user,
    get_user_by_id,
)

router = APIRouter(prefix="/auth", tags=["auth"])


async def get_current_user(
    db: db_dependency,
    access_token: Annotated[
        str | None, Cookie(alias=ACCESS_TOKEN_COOKIE_NAME)
    ] = None,
) -> User:
    """Resolve the authenticated user from the HttpOnly access-token cookie."""
    if access_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    user_id = decode_access_token(access_token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        )

    user = await get_user_by_id(user_id, db)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        )
    return user


CurrentUserDependency = Annotated[User, Depends(get_current_user)]


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    user_data: RegisterRequest,
    db: db_dependency,
) -> UserResponse:
    """Register a new user."""
    try:
        user = await create_user(user_data, db)

    except UserAlreadyExistsError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error
    
    return UserResponse.model_validate(user)


@router.post("/login", response_model=UserResponse)
async def login(
    credentials: LoginRequest,
    response: Response,
    db: db_dependency,
) -> UserResponse:
    """Authenticate a user and set the JWT in an HttpOnly cookie."""
    user = await authenticate_user(credentials.email, credentials.password, db)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(user.id)
    set_access_token_cookie(response, token)
    return UserResponse.model_validate(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response) -> None:
    """Clear the access-token cookie."""
    clear_access_token_cookie(response)


@router.get("/me", response_model=UserResponse)
async def read_current_user(
    current_user: CurrentUserDependency,
) -> UserResponse:
    """Return the authenticated user's public profile."""
    return UserResponse.model_validate(current_user)
