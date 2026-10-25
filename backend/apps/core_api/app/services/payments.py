import asyncio
from collections.abc import Mapping
from typing import Literal
from uuid import UUID

import stripe
from sqlalchemy import select

from ..config import settings
from ..db.models import Payment, User
from ..db.session import db_dependency
from ..schemas.payments import CheckoutSessionResponse

_CHECKOUT_EVENT_STATUSES: dict[str, Literal["pending", "paid", "failed", "expired"]] = {
    "checkout.session.completed": "pending",
    "checkout.session.async_payment_succeeded": "paid",
    "checkout.session.async_payment_failed": "failed",
    "checkout.session.expired": "expired",
}


class PaymentConfigurationError(Exception):
    """Raised when required Stripe settings are missing."""


class UserNotFoundError(Exception):
    """Raised when the requested user does not exist."""


class AIChatAlreadyUnlockedError(Exception):
    """Raised when the user already has AI chat access."""


class CheckoutSessionCreationError(Exception):
    """Raised when Stripe does not return a usable checkout URL."""


class PaymentNotFoundError(Exception):
    """Raised when a Stripe checkout session has no matching local payment."""


def _get_stripe_configuration() -> tuple[str, str]:
    if settings.stripe_secret_key is None:
        raise PaymentConfigurationError("Stripe secret key is not configured")
    
    if not settings.stripe_unlock_price_id:
        raise PaymentConfigurationError("Stripe AI unlock price is not configured")
    
    return (
        settings.stripe_secret_key.get_secret_value(),
        settings.stripe_unlock_price_id,
    )


async def create_checkout_session(
    user_id: UUID,
    db: db_dependency,
) -> CheckoutSessionResponse:
    """Create a Stripe Checkout session for unlocking AI chat."""
    user = await db.get(User, user_id)
    if user is None:
        raise UserNotFoundError("User not found")
    
    if user.ai_chat_unlocked:
        raise AIChatAlreadyUnlockedError("AI chat is already unlocked")

    stripe_api_key, price_id = _get_stripe_configuration()
    checkout = await asyncio.to_thread(
        stripe.checkout.Session.create,
        mode="payment",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=settings.stripe_success_url,
        cancel_url=settings.stripe_cancel_url,
        client_reference_id=str(user.id),
        customer_email=user.email,
        metadata={"user_id": str(user.id)},
        api_key=stripe_api_key,
    )

    checkout_url = checkout.url
    if not checkout.id or not checkout_url:
        raise CheckoutSessionCreationError(
            "Stripe did not return a checkout session ID and URL"
        )

    payment = Payment(
        user_id=user.id,
        stripe_checkout_session_id=checkout.id,
        status="pending",
    )
    db.add(payment)
    await db.commit()
    return CheckoutSessionResponse(checkout_url=checkout_url)


async def list_user_payments(
    user_id: UUID,
    db: db_dependency,
) -> list[Payment]:
    """Return a user's payment records, newest first."""
    result = await db.execute(
        select(Payment)
        .where(Payment.user_id == user_id)
        .order_by(Payment.created_at.desc(), Payment.id.desc())
    )
    return list(result.scalars().all())


async def process_checkout_event(
    event_type: str,
    checkout_session: Mapping[str, object],
    db: db_dependency,
) -> Payment | None:
    """Apply a verified Stripe Checkout event to the local payment record.

    The caller must verify the Stripe webhook signature before calling this
    function. Unhandled Checkout event types are ignored.
    """
    payment_status = _CHECKOUT_EVENT_STATUSES.get(event_type)
    if payment_status is None:
        return None
    
    if (
        event_type == "checkout.session.completed"
        and checkout_session.get("payment_status") == "paid"
    ):
        payment_status = "paid"

    checkout_session_id = checkout_session.get("id")
    if not isinstance(checkout_session_id, str) or not checkout_session_id:
        raise ValueError("Stripe Checkout event is missing its session ID")

    result = await db.execute(
        select(Payment).where(
            Payment.stripe_checkout_session_id == checkout_session_id
        )
    )
    payment = result.scalar_one_or_none()
    if payment is None:
        raise PaymentNotFoundError("No payment matches this Stripe Checkout session")

    if payment.status != "paid" or payment_status == "paid":
        payment.status = payment_status

    payment_intent_id = checkout_session.get("payment_intent")
    if isinstance(payment_intent_id, str):
        payment.stripe_payment_intent_id = payment_intent_id

    amount_total = checkout_session.get("amount_total")
    if isinstance(amount_total, int):
        payment.amount_total = amount_total

    currency = checkout_session.get("currency")
    if isinstance(currency, str):
        payment.currency = currency

    if payment.status == "paid":
        user = await db.get(User, payment.user_id)

        if user is None:
            raise UserNotFoundError("Payment owner no longer exists")
        
        user.ai_chat_unlocked = True

    await db.commit()
    await db.refresh(payment)
    return payment
