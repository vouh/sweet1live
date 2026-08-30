"""Supabase Storage — the public bucket that holds staff-uploaded dish photos.

Talks to the Storage REST API directly with the service-role key rather than
pulling in the supabase-py SDK, since uploading a file and creating a bucket
is all this backend needs from Supabase. Mirrors stripe_client.py: a clear
503 when the venue hasn't configured it yet, so the rest of the API still
works in a fresh clone.
"""

import uuid
from urllib.parse import quote

import httpx
from fastapi import HTTPException, status

from app.config import settings

MENU_IMAGES_BUCKET = "menu-images"

_bucket_ready = False


def _require_configured() -> None:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Image uploads are not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
        )


def _headers() -> dict[str, str]:
    key = settings.supabase_service_role_key
    return {"Authorization": f"Bearer {key}", "apikey": key}


def _storage_url(path: str) -> str:
    return f"{settings.supabase_url.rstrip('/')}/storage/v1/{path}"


def _ensure_bucket() -> None:
    """Creates the public menu-images bucket the first time it's needed.

    Idempotent — a second call, or another worker process racing this one,
    just gets a 400 "already exists" from Supabase, which is fine.
    """
    global _bucket_ready
    if _bucket_ready:
        return
    response = httpx.post(
        _storage_url("bucket"),
        headers=_headers(),
        json={"id": MENU_IMAGES_BUCKET, "name": MENU_IMAGES_BUCKET, "public": True},
        timeout=10,
    )
    if response.status_code >= 400 and "already exists" not in response.text.lower():
        response.raise_for_status()
    _bucket_ready = True


def upload_menu_image(filename: str, content: bytes, content_type: str) -> str:
    """Uploads one dish photo and returns its public URL."""
    _require_configured()
    _ensure_bucket()

    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    key = f"{uuid.uuid4().hex}.{extension}"

    response = httpx.post(
        _storage_url(f"object/{MENU_IMAGES_BUCKET}/{key}"),
        headers={**_headers(), "Content-Type": content_type},
        content=content,
        timeout=30,
    )
    response.raise_for_status()

    return _storage_url(f"object/public/{MENU_IMAGES_BUCKET}/{quote(key)}")
