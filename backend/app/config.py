from pathlib import Path

from pydantic import AliasChoices, Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Repo root `.env.local` — shared by Next.js and FastAPI
_ROOT_ENV = Path(__file__).resolve().parents[2] / ".env.local"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ROOT_ENV) if _ROOT_ENV.is_file() else None,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Supabase PostgreSQL — set DATABASE_URL in `.env.local` (no SQLite default).
    database_url: str = ""
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
    # When Stripe charges in another currency (e.g. USD), convert to `currency` on payment.
    convert_foreign_payments: bool = True
    checkout_hold_minutes: int = 30
    staff_api_key: str = "sweet1ne-dev-staff-key-change-me"
    # Private hire is enquiry-only in production. Set to true only for legacy/tests.
    room_online_booking_enabled: bool = Field(
        default=False,
        validation_alias=AliasChoices("ROOM_ONLINE_BOOKING_ENABLED"),
    )

    resend_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("RESEND_API_KEY"),
    )
    resend_from: str = Field(
        default="",
        validation_alias=AliasChoices("RESEND_FROM"),
    )
    super_admin_email: str = Field(
        default="",
        validation_alias=AliasChoices("SUPER_ADMIN_EMAIL"),
    )
    super_admin_password: str = Field(
        default="",
        validation_alias=AliasChoices("SUPER_ADMIN_PASSWORD"),
    )
    super_admin_name: str = Field(
        default="Super Admin",
        validation_alias=AliasChoices("SUPER_ADMIN_NAME"),
    )

    # Optional Cloudflare Turnstile — when set, public forms must pass siteverify.
    turnstile_secret_key: str = Field(
        default="",
        validation_alias=AliasChoices("TURNSTILE_SECRET_KEY"),
    )
    allow_dev_login_prefill: bool = Field(
        default=False,
        validation_alias=AliasChoices("ALLOW_DEV_LOGIN_PREFILL"),
    )

    @property
    def dev_login_prefill_enabled(self) -> bool:
        if self.allow_dev_login_prefill:
            return True
        site = self.public_site_url.lower()
        return "localhost" in site or "127.0.0.1" in site

    @model_validator(mode="after")
    def _require_postgres_database(self) -> "Settings":
        import os

        if not self.jwt_secret.strip():
            self.jwt_secret = "sweet1ne-dev-secret-change-me"

        url = self.database_url.strip()
        if not url:
            raise ValueError(
                "DATABASE_URL is required. Add your Supabase PostgreSQL URL to .env.local."
            )
        if url.startswith("sqlite") and os.getenv("ALLOW_SQLITE_TESTS") != "1":
            raise ValueError(
                "SQLite is not used in this project. Set DATABASE_URL to Supabase PostgreSQL."
            )
        return self

    @property
    def stripe_enabled(self) -> bool:
        return bool(self.stripe_secret_key)


settings = Settings()
