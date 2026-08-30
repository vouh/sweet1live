"""A small in-memory rate limiter for auth endpoints.

Not distributed — counters live in this process's memory, so a multi-worker
deployment gets independent limits per worker. That's an acceptable trade for
this deployment's scale; swap for a Redis-backed limiter if that changes.
Good enough to stop casual brute-forcing and email-bombing, which is the
actual threat on a small venue's staff login.
"""

from __future__ import annotations

import time
from collections import defaultdict

from fastapi import HTTPException, Request, status

from app.config import settings

_hits: dict[str, list[float]] = defaultdict(list)


def clear_rate_limits() -> None:
    """Dev helper — call on API startup so a restart clears lockouts."""
    _hits.clear()


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def enforce_rate_limit(key: str, *, limit: int, window_seconds: int) -> None:
    """Raises 429 if `key` has been hit `limit` or more times in the trailing window."""
    # Local dev: don't lock yourself out while testing login / reset flows.
    if settings.dev_login_prefill_enabled and (
        key.startswith("login-") or key.startswith("forgot-") or key.startswith("set-password-")
    ):
        return

    now = time.monotonic()
    bucket = _hits[key]
    cutoff = now - window_seconds
    while bucket and bucket[0] < cutoff:
        bucket.pop(0)
    if len(bucket) >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. Please wait a few minutes and try again.",
        )
    bucket.append(now)
