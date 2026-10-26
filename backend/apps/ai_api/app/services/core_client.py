"""HTTP client for authenticated Core API operations."""

from datetime import datetime
from uuid import UUID

import httpx
from pydantic import BaseModel, ConfigDict, EmailStr, ValidationError

from ..config import settings

_CORE_API_TIMEOUT_SECONDS = 10.0


class CoreUser(BaseModel):
    """Public user data returned by the Core API."""

    model_config = ConfigDict(extra="ignore")

    id: UUID
    email: EmailStr
    username: str
    is_active: bool
    ai_chat_unlocked: bool
    created_at: datetime


class CoreAPIError(Exception):
    """Base exception for failed Core API requests."""


class CoreAuthenticationError(CoreAPIError):
    """Raised when the Core API rejects the user's access token."""


class CoreAPIUnavailableError(CoreAPIError):
    """Raised when the Core API cannot be reached or returns a server error."""


class CoreAPIResponseError(CoreAPIError):
    """Raised when the Core API returns an unexpected or invalid response."""


async def _fetch_core_user(
    client: httpx.AsyncClient,
    access_token: str,
) -> CoreUser:
    endpoint = f"{settings.api_v1_prefix.rstrip('/')}/auth/me"
    try:
        response = await client.get(
            endpoint,
            cookies={"access_token": access_token},
        )

    except httpx.RequestError as error:
        raise CoreAPIUnavailableError("Unable to reach the Core API") from error

    if response.status_code in (401, 403):
        raise CoreAuthenticationError("Core API rejected the access token")
    
    if response.is_server_error:
        raise CoreAPIUnavailableError(
            f"Core API returned server error {response.status_code}"
        )
    if not response.is_success:
        raise CoreAPIResponseError(
            f"Core API returned unexpected status {response.status_code}"
        )

    try:
        return CoreUser.model_validate(response.json())
    
    except (ValueError, ValidationError) as error:
        raise CoreAPIResponseError(
            "Core API returned an invalid user response"
        ) from error


async def get_core_user(
    access_token: str,
    *,
    client: httpx.AsyncClient | None = None,
) -> CoreUser:
    """Validate an access token with the Core API and return its user profile.

    The token is forwarded as the HttpOnly cookie expected by the Core API.
    A client can be injected for testing or shared connection management.
    """
    if not access_token.strip():
        raise CoreAuthenticationError("An access token is required")

    if client is not None:
        return await _fetch_core_user(client, access_token)

    async with httpx.AsyncClient(
        base_url=settings.core_api_url.rstrip("/"),
        timeout=_CORE_API_TIMEOUT_SECONDS,
    ) as core_client:
        return await _fetch_core_user(core_client, access_token)
