"""Structured security event logging — no credentials, no PII beyond IP + path."""

from __future__ import annotations

import logging

logger = logging.getLogger("sweet1ne.security")


def _log(event: str, **fields: str | int) -> None:
    parts = " ".join(f"{k}={v}" for k, v in fields.items())
    logger.warning("%s %s", event, parts)


def auth_failure(*, ip: str, endpoint: str, reason: str) -> None:
    _log("auth_failure", ip=ip, endpoint=endpoint, reason=reason)


def rate_limited(*, ip: str, endpoint: str) -> None:
    _log("rate_limited", ip=ip, endpoint=endpoint)


def bot_trap(*, ip: str, endpoint: str, trap: str) -> None:
    _log("bot_trap", ip=ip, endpoint=endpoint, trap=trap)


def suspicious_request(*, ip: str, endpoint: str, detail: str) -> None:
    _log("suspicious_request", ip=ip, endpoint=endpoint, detail=detail)
