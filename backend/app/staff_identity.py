"""Staff identity — credentials and login live with an external auth
provider, not in our own database.

Talks to the provider's REST API directly with httpx rather than pulling in
its SDK, since creating/updating a user, signing in, and verifying a token is
all this backend needs. RBAC (roles/permissions/role_assignments) stays
entirely in our own tables, keyed off `StaffMember.id` as before — the
provider only owns "is this email and password combination valid, and what's
the resulting user id."
"""

from __future__ import annotations

import logging

import httpx
import jwt
from fastapi import HTTPException, status

from app.config import settings

logger = logging.getLogger(__name__)


def _require_configured() -> None:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Staff auth is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
        )


def _admin_headers() -> dict[str, str]:
    key = settings.supabase_service_role_key
    return {"Authorization": f"Bearer {key}", "apikey": key, "Content-Type": "application/json"}


def _auth_url(path: str) -> str:
    return f"{settings.supabase_url.rstrip('/')}/auth/v1/{path}"


def create_user(email: str, password: str) -> str:
    """Creates a pre-confirmed account with the auth provider and returns its id.

    Pre-confirmed because our own invite/reset link (emailed via Resend) is
    already the proof the staff member controls that inbox — the provider's
    own "confirm your email" step would be a second, redundant loop.
    """
    _require_configured()
    response = httpx.post(
        _auth_url("admin/users"),
        headers=_admin_headers(),
        json={"email": email, "password": password, "email_confirm": True},
        timeout=15,
    )
    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not create the staff account with the auth provider.",
        )
    return response.json()["id"]


def set_password(identity_id: str, new_password: str) -> None:
    _require_configured()
    response = httpx.put(
        _auth_url(f"admin/users/{identity_id}"),
        headers=_admin_headers(),
        json={"password": new_password},
        timeout=15,
    )
    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not update the password with the auth provider.",
        )


def sign_in_with_password(email: str, password: str) -> tuple[str, str]:
    """Returns (access_token, identity_id). Raises 401 on bad credentials."""
    _require_configured()
    if not settings.supabase_publishable_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Staff auth is not configured. Set SUPABASE_PUBLISHABLE_KEY.",
        )
    response = httpx.post(
        _auth_url("token"),
        params={"grant_type": "password"},
        headers={
            "apikey": settings.supabase_publishable_key,
            "Content-Type": "application/json",
        },
        json={"email": email, "password": password},
        timeout=15,
    )
    if response.status_code >= 400:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    data = response.json()
    return data["access_token"], data["user"]["id"]


_jwks_client: jwt.PyJWKClient | None = None


def _get_jwks_client() -> jwt.PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        # Fetches and caches the provider's public keys, matching by the
        # token's `kid` header — verifies a token signed with an asymmetric
        # key (the provider's current default) without us holding a secret.
        _jwks_client = jwt.PyJWKClient(_auth_url(".well-known/jwks.json"), cache_keys=True)
    return _jwks_client


def verify_access_token(token: str) -> str | None:
    """Returns the identity id (the `sub` claim) for a valid, unexpired
    access token issued by the auth provider. None if invalid, expired, or
    unconfigured.
    """
    if not settings.supabase_url:
        return None

    try:
        signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token, signing_key.key, algorithms=["ES256", "RS256"], audience="authenticated"
        )
        return payload.get("sub")
    except jwt.PyJWTError:
        return None
    except Exception:
        # Not a "this token is invalid" case — something's actually broken
        # (network, missing dependency, bad key-set response). Log it instead
        # of silently falling through, so a real bug here doesn't just look
        # like "nobody can log in" with no clue why.
        logger.exception("Unexpected error verifying staff access token via the provider's key set")

    # Older-style projects sign with HS256 against a shared secret instead of
    # a published key set. Kept as a fallback in case this project is ever
    # configured that way.
    if settings.supabase_jwt_secret:
        try:
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
            return payload.get("sub")
        except jwt.PyJWTError:
            return None
    return None
