from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Point this at your Supabase project's connection string, e.g.:
    # postgresql+psycopg2://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
    # Defaults to a local SQLite file so the API runs out of the box without Supabase.
    database_url: str = "sqlite:///./dev.db"

    cors_origins: list[str] = ["http://localhost:3000"]

    # Used to sign guest account JWTs. Override in production.
    jwt_secret: str = "sweet1ne-dev-secret-change-me"
    jwt_expire_hours: int = 72 * 24

    # ---------- Stripe ----------
    # Test keys from https://dashboard.stripe.com/test/apikeys.
    # Leaving stripe_secret_key empty disables checkout (the API stays up and the
    # catalogue still reads, so the site runs without Stripe configured).
    stripe_secret_key: str = ""
    # From `stripe listen --forward-to localhost:8000/stripe/webhook`, or the
    # dashboard endpoint's signing secret. Required to accept webhooks.
    stripe_webhook_secret: str = ""

    # Where Stripe returns the customer after hosted checkout.
    public_site_url: str = "http://localhost:3000"

    currency: str = "gbp"

    # A pending order holds ticket inventory for this long; after that a sweeper
    # (and Stripe's own session expiry) releases the seats back to the pool.
    checkout_hold_minutes: int = 30

    # Staff endpoints (door check-in, booking admin) are gated on this shared
    # secret sent as the X-Staff-Key header. Override in production.
    staff_api_key: str = "sweet1ne-dev-staff-key-change-me"

    @property
    def stripe_enabled(self) -> bool:
        return bool(self.stripe_secret_key)


settings = Settings()
