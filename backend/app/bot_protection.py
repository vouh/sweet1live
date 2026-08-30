"""Honeypot, timing, and optional Turnstile checks for public form POSTs."""

from __future__ import annotations

import time
from typing import Any

import httpx
from fastapi import HTTPException, Request, status

from app.config import settings
from app.rate_limit import client_ip, enforce_rate_limit
from app.security_log import bot_trap, rate_limited, suspicious_request

# Minimum time (ms) between form render and submit — blocks instant bot posts.
MIN_FORM_MS = 2_000
# Reject forms older than 24 h — stale tokens often mean replay scripts.
MAX_FORM_MS = 24 * 60 * 60 * 1000

# Obvious automation UAs on guest-facing forms (staff/API clients use auth instead).
_BLOCKED_UA_FRAGMENTS = (
    "curl/",
    "python-requests",
    "python-urllib",
    "scrapy",
    "httpclient",
    "go-http-client",
    "java/",
    "libwww",
    "wget/",
    "bot@",
    "spider",
)


class BotRejected(Exception):
    """Silent discard — caller should return a fake success response."""

    pass


def enforce_public_form_rate_limit(request: Request, *, limit: int = 12, window_seconds: int = 3600) -> None:
    ip = client_ip(request)
    try:
        enforce_rate_limit(f"public-form-ip:{ip}", limit=limit, window_seconds=window_seconds)
    except HTTPException:
        rate_limited(ip=ip, endpoint=request.url.path)
        raise


def verify_public_form_submission(
    request: Request,
    *,
    hp: str | None,
    form_ts: int | None,
    turnstile_token: str | None = None,
) -> None:
    """Raises BotRejected (silent), HTTPException, or returns normally."""
    ip = client_ip(request)
    path = request.url.path

    ua = (request.headers.get("user-agent") or "").lower()
    if any(fragment in ua for fragment in _BLOCKED_UA_FRAGMENTS):
        suspicious_request(ip=ip, endpoint=path, detail="blocked_user_agent")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This request could not be processed.",
        )

    if hp and hp.strip():
        bot_trap(ip=ip, endpoint=path, trap="honeypot")
        raise BotRejected()

    if form_ts is None:
        suspicious_request(ip=ip, endpoint=path, detail="missing_form_ts")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Form expired. Please refresh the page and try again.",
        )

    now_ms = int(time.time() * 1000)
    elapsed = now_ms - form_ts
    if elapsed < MIN_FORM_MS:
        bot_trap(ip=ip, endpoint=path, trap="too_fast")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait a moment before submitting.",
        )
    if elapsed > MAX_FORM_MS:
        suspicious_request(ip=ip, endpoint=path, detail="stale_form_ts")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Form expired. Please refresh the page and try again.",
        )

    if settings.turnstile_secret_key:
        _verify_turnstile(token=turnstile_token, ip=ip, endpoint=path)


def _verify_turnstile(*, token: str | None, ip: str, endpoint: str) -> None:
    if not token or not token.strip():
        suspicious_request(ip=ip, endpoint=endpoint, detail="missing_turnstile")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please complete the security check and try again.",
        )
    try:
        response = httpx.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            data={
                "secret": settings.turnstile_secret_key,
                "response": token,
                "remoteip": ip,
            },
            timeout=5.0,
        )
        data: dict[str, Any] = response.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Security check unavailable. Please try again shortly.",
        ) from None

    if not data.get("success"):
        bot_trap(ip=ip, endpoint=endpoint, trap="turnstile_failed")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Security check failed. Please try again.",
        )


def extract_bot_fields(body: dict[str, Any]) -> tuple[str | None, int | None, str | None]:
    """Pull `_hp`, `_ts`, `_ts_token` from JSON body; strip before ORM validation."""
    hp = body.pop("_hp", None)
    raw_ts = body.pop("_ts", None)
    turnstile = body.pop("_ts_token", None)
    form_ts: int | None = None
    if raw_ts is not None:
        try:
            form_ts = int(raw_ts)
        except (TypeError, ValueError):
            form_ts = None
    hp_str = str(hp).strip() if hp is not None else None
    token_str = str(turnstile).strip() if turnstile is not None else None
    return hp_str or None, form_ts, token_str or None
