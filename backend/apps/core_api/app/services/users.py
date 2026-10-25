import asyncio
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import or_, select

from ..db.models import User
from ..db.session import db_dependency
from ..schemas.auth import RegisterRequest
from ..security.auth import hash_password, verify_password


class UserAlreadyExistsError(Exception):
    """Raised when a registration email or username is already in use."""


async def get_user_by_id(user_id: UUID, db: db_dependency) -> User | None:
    """Return the user with the given ID, if one exists."""
    return await db.get(User, user_id)


async def get_user_by_email(email: str, db: db_dependency) -> User | None:
    """Return the user with the given email, ignoring surrounding whitespace and case."""
    normalized_email = email.strip().casefold()
    result = await db.execute(select(User).where(User.email == normalized_email))
    return result.scalar_one_or_none()


async def create_user(user_data: RegisterRequest, db: db_dependency) -> User:
    """Create a user after checking uniqueness and hashing the password."""
    email = user_data.email.strip().casefold()
    username = user_data.username.strip()
    if not email or not username:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email and username must not be blank",
        )

    user = User(
        email=email,
        username=username,
        hashed_password=await asyncio.to_thread(hash_password, user_data.password),
    )
    existing_user = await db.execute(
        select(User.id)
        .where(or_(User.email == email, User.username == username))
        .limit(1)
    )
    if existing_user.scalar_one_or_none() is not None:
        raise UserAlreadyExistsError("Email or username is already registered")

    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(
    email: str,
    password: str,
    db: db_dependency,
) -> User | None:
    """Return an active user when the supplied email and password match."""
    user = await get_user_by_email(email, db)
    if user is None or not user.is_active:
        return None

    password_matches = await asyncio.to_thread(
        verify_password, password, user.hashed_password
    )
    return user if password_matches else None
