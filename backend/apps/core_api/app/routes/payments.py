"""Payment routes and Stripe webhook handling for the Core API."""

from collections.abc import Mapping

import stripe
from fastapi import APIRouter, Header, HTTPException, Request, Response, status

from ..config import settings
from ..db.session import db_dependency
from ..routes.auth import CurrentUserDependency
from ..schemas.payments import CheckoutSessionResponse, PaymentResponse
from ..services.payments import (
    AIChatAlreadyUnlockedError,
    CheckoutSessionCreationError,
    PaymentConfigurationError,
    PaymentNotFoundError,
    UserNotFoundError,
    create_checkout_session,
    list_user_payments,
    process_checkout_event,
)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/checkout", response_model=CheckoutSessionResponse)
async def start_checkout(
    current_user: CurrentUserDependency,
    db: db_dependency,
) -> CheckoutSessionResponse:
    """Create a Stripe Checkout URL for the authenticated user."""
    try:
        return await create_checkout_session(current_user.id, db)
    
    except UserNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error
    
    except AIChatAlreadyUnlockedError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error
    
    except PaymentConfigurationError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment processing is not configured",
        ) from error
    
    except CheckoutSessionCreationError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Stripe did not provide a usable Checkout session",
        ) from error
    
    except stripe.StripeError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to create a Stripe Checkout session",
        ) from error


@router.get("", response_model=list[PaymentResponse])
async def get_payment_history(
    current_user: CurrentUserDependency,
    db: db_dependency,
) -> list[PaymentResponse]:
    """Return payment history for the authenticated user."""
    payments = await list_user_payments(current_user.id, db)
    return [PaymentResponse.model_validate(payment) for payment in payments]


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    db: db_dependency,
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
) -> Response:
    """Verify and process Stripe Checkout webhook events."""
    if settings.stripe_webhook_secret is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe webhook processing is not configured",
        )
    
    if stripe_signature is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe-Signature header",
        )

    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(
            payload,
            stripe_signature,
            settings.stripe_webhook_secret.get_secret_value(),
        )

    except (ValueError, stripe.SignatureVerificationError) as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Stripe webhook payload or signature",
        ) from error

    event_data = event.to_dict().get("data")
    checkout_session = (
        event_data.get("object")
        if isinstance(event_data, Mapping)
        else None
    )
    if not isinstance(checkout_session, Mapping):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stripe webhook event has an invalid data object",
        )

    try:
        await process_checkout_event(event.type, checkout_session, db)

    except PaymentNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stripe Checkout session has no matching payment record",
        ) from error
    
    except UserNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment owner could not be found",
        ) from error

    return Response(status_code=status.HTTP_200_OK)
