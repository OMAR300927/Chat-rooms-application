from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
from fastapi import Response
from pwdlib import PasswordHash
from pydantic import ValidationError
from pwdlib.exceptions import UnknownHashError

from ..config import settings
from ..schemas.auth import TokenPayload

ACCESS_TOKEN_COOKIE_NAME = "access_token"
_JWT_ALGORITHM = "HS256"
_password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """Hash a plaintext password for storage."""
    return _password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against its stored hash."""
    try:
        return _password_hash.verify(password, hashed_password)
    
    except UnknownHashError:
        return False


def create_access_token(user_id: UUID) -> str:
    """Create a signed JWT containing the user's ID and expiration."""
    now = datetime.now(UTC)
    expires_at = now + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode(
        {"sub": str(user_id), "iat": now, "exp": expires_at},
        settings.secret_key.get_secret_value(),
        algorithm=_JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> UUID | None:
    """Validate a JWT and return its subject, or None if invalid or expired."""
    try:
        claims = jwt.decode(
            token,
            settings.secret_key.get_secret_value(),
            algorithms=[_JWT_ALGORITHM],
            options={"require": ["exp", "iat", "sub"]},
        )
        return TokenPayload.model_validate(claims).sub
    
    except (jwt.InvalidTokenError, ValidationError):
        return None


def set_access_token_cookie(response: Response, token: str) -> None:
    """Set the access token as an HttpOnly cookie on an API response."""
    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE_NAME,
        value=token,
        max_age=settings.access_token_expire_minutes * 60,
        httponly=True,
        secure=settings.environment.lower() in {"production", "prod"},
        samesite="lax",
        path="/",
    )


def clear_access_token_cookie(response: Response) -> None:
    """Expire the access-token cookie on an API response."""
    response.delete_cookie(
        key=ACCESS_TOKEN_COOKIE_NAME,
        httponly=True,
        secure=settings.environment.lower() in {"production", "prod"},
        samesite="lax",
        path="/",
    )
