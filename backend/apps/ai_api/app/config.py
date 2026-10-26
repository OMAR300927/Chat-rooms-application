"""Settings for the AI API service."""

from pathlib import Path
from typing import Annotated

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "AI Assistant API"
    environment: str = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    cors_origins: Annotated[list[str], NoDecode] = ["http://localhost:5173"]

    database_url: str = Field(
        default="sqlite+aiosqlite:///./data/ai.db",
        validation_alias="AI_DATABASE_URL",
    )
    core_api_url: str = Field(
        default="http://localhost:8000",
        validation_alias="CORE_API_URL",
    )

    gemini_api_key: SecretStr | None = None
    gemini_chat_model: str = "gemini-3.8-flash"
    gemini_embedding_model: str = "gemini-embedding-2"

    chroma_persist_directory: Path = Field(
        default=BACKEND_ROOT / "data" / "chroma"
    )
    upload_directory: Path = Field(default=BACKEND_ROOT / "data" / "uploads")
    max_pdf_size_mb: int = 10

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("chroma_persist_directory", "upload_directory", mode="before")
    @classmethod
    def resolve_backend_path(cls, value: str | Path) -> Path:
        path = Path(value)
        if path.is_absolute():
            return path
        return BACKEND_ROOT / path

    @field_validator("max_pdf_size_mb")
    @classmethod
    def validate_max_pdf_size(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("max_pdf_size_mb must be positive")
        return value


settings = Settings()
