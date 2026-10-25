from pathlib import Path
from typing import Annotated

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Chat and AI Assistant API"
    environment: str = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    secret_key: SecretStr
    access_token_expire_minutes: int = 30

    database_url: str
    cors_origins: Annotated[list[str], NoDecode] = ["http://localhost:5173"]

    stripe_secret_key: SecretStr | None = None
    stripe_webhook_secret: SecretStr | None = None
    stripe_unlock_price_id: str | None = None
    stripe_success_url: str = "http://localhost:5173/payment/success"
    stripe_cancel_url: str = "http://localhost:5173/payment/cancel"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("access_token_expire_minutes")
    @classmethod
    def validate_token_expiration(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("access_token_expire_minutes must be positive")
        return value


settings = Settings() #type: ignore
