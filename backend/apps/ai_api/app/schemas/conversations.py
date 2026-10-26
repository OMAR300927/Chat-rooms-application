"""Conversation request and response schemas for the AI API."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .documents import DocumentResponse
from .messages import MessageResponse


class ConversationCreateRequest(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    document_ids: list[UUID] = Field(default_factory=list)

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str | None
    created_at: datetime
    updated_at: datetime


class ConversationDetailResponse(ConversationResponse):
    documents: list[DocumentResponse] = Field(default_factory=list)
    messages: list[MessageResponse] = Field(default_factory=list)
