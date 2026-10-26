"""Document upload and response schemas for the AI API."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from ..db.models import DocumentStatus


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    filename: str
    status: DocumentStatus
    created_at: datetime
    updated_at: datetime
