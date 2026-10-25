from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CheckoutSessionResponse(BaseModel):
    checkout_url: str


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: str
    amount_total: int | None
    currency: str | None
    created_at: datetime
