"""Thin wrapper around the Stripe SDK.

Keeps the API key in one place and gives a clear 503 when the venue has not
configured Stripe yet, so the catalogue endpoints still work in a fresh clone.
"""

import stripe
from fastapi import HTTPException, status

from app.config import settings

stripe.api_key = settings.stripe_secret_key or None


def require_stripe() -> "stripe":
    if not settings.stripe_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Card payments are not configured. Set STRIPE_SECRET_KEY.",
        )
    # Re-assert in case settings were reloaded in a test.
    stripe.api_key = settings.stripe_secret_key
    return stripe


def construct_webhook_event(payload: bytes, signature: str | None):
    """Verify the Stripe-Signature header and return the parsed event.

    Never trust an unverified webhook body: without this check anyone who finds
    the URL could mark orders paid.
    """
    if not settings.stripe_webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Webhooks are not configured. Set STRIPE_WEBHOOK_SECRET.",
        )
    if not signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe-Signature header",
        )
    try:
        return stripe.Webhook.construct_event(
            payload=payload,
            sig_header=signature,
            secret=settings.stripe_webhook_secret,
        )
    except ValueError as exc:  # malformed JSON
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload") from exc
    except stripe.SignatureVerificationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature") from exc
