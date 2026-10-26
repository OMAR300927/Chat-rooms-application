"""Shared request dependencies for AI API routes."""

from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status

from ..services.core_client import (
    CoreAPIResponseError,
    CoreAPIUnavailableError,
    CoreAuthenticationError,
    CoreUser,
    get_core_user,
)


async def get_current_user(
    access_token: Annotated[str | None, Cookie(alias="access_token")] = None,
) -> CoreUser:
    """Authenticate the request against the Core API using its access cookie."""
    if access_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    try:
        user = await get_core_user(access_token)

    except CoreAuthenticationError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        ) from error
    
    except CoreAPIUnavailableError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Core API is unavailable",
        ) from error
    
    except CoreAPIResponseError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Core API returned an invalid response",
        ) from error

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
        )
    return user


CurrentUserDependency = Annotated[CoreUser, Depends(get_current_user)]
