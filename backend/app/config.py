from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Repo root `.env.local` — shared by Next.js and FastAPI
_ROOT_ENV = Path(__file__).resolve().parents[2] / ".env.local"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ROOT_ENV) if _ROOT_ENV.is_file() else None,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "sqlite:///./dev.db"
    cors_origins: list[str] = ["http://localhost:3000"]

    # Reads NEXT_PUBLIC_* from the shared file so we don't duplicate keys
    supabase_url: str = Field(
        default="",
        validation_alias=AliasChoices("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"),
    )
    supabase_publishable_key: str = Field(
        default="",
        validation_alias=AliasChoices(
            "SUPABASE_PUBLISHABLE_KEY",
            "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        ),
    )
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    jwt_secret: str = "sweet1ne-dev-secret-change-me"
    jwt_expire_hours: int = 72 * 24

    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    public_site_url: str = "http://localhost:3000"
    currency: str = "gbp"
    checkout_hold_minutes: int = 30
    staff_api_key: str = "sweet1ne-dev-staff-key-change-me"

    @property
    def stripe_enabled(self) -> bool:
        return bool(self.stripe_secret_key)


settings = Settings()
