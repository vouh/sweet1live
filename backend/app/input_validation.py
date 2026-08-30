"""Input validation and sanitisation for staff-facing forms.

SQLModel already parameterises queries — this layer blocks oversize payloads,
control characters, and characters that don't belong in a given field before
they ever reach the ORM.
"""

from __future__ import annotations

import re

# ---------------------------------------------------------------------------
# Limits
# ---------------------------------------------------------------------------

MAX_EMAIL_LEN = 254
MAX_PASSWORD_LEN = 128
MAX_NAME_LEN = 120
MAX_PHONE_LEN = 32
MAX_LOCATION_LEN = 120
MAX_JOB_TITLE_LEN = 80
MAX_NOTES_LEN = 500
MAX_LOGIN_PASSWORD_LEN = 128

STAFF_STATUSES = frozenset({"invited", "active", "suspended"})

# Reject null bytes and ASCII control chars (except tab/newline where noted).
_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")

_NAME_PATTERN = re.compile(r"^[\w\s.'\-]+$", re.UNICODE)
_PHONE_PATTERN = re.compile(r"^\+?[\d\s().\-]{7,32}$")
_LOCATION_PATTERN = re.compile(r"^[\w\s.,'\-/&#()]+$", re.UNICODE)
_JOB_TITLE_PATTERN = re.compile(r"^[\w\s.&'\-/()]+$", re.UNICODE)
_EMAIL_PATTERN = re.compile(r"^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$")


def _reject_control_chars(value: str, field: str) -> str:
    if _CONTROL_CHARS.search(value):
        raise ValueError(f"{field} contains invalid characters.")
    return value


def sanitize_optional_text(
    value: str | None,
    *,
    field: str,
    max_len: int,
    pattern: re.Pattern[str] | None = None,
    allow_empty: bool = True,
) -> str:
    if value is None:
        return ""
    cleaned = value.strip()
    if not cleaned:
        if allow_empty:
            return ""
        raise ValueError(f"{field} is required.")
    cleaned = _reject_control_chars(cleaned, field)
    if len(cleaned) > max_len:
        raise ValueError(f"{field} must be {max_len} characters or fewer.")
    if pattern and not pattern.match(cleaned):
        raise ValueError(f"{field} contains characters that aren't allowed.")
    return cleaned


def validate_staff_name(value: str) -> str:
    return sanitize_optional_text(
        value, field="Name", max_len=MAX_NAME_LEN, pattern=_NAME_PATTERN, allow_empty=False
    )


def validate_staff_email(value: str) -> str:
    cleaned = sanitize_optional_text(
        value, field="Email", max_len=MAX_EMAIL_LEN, allow_empty=False
    ).lower()
    if not _EMAIL_PATTERN.match(cleaned):
        raise ValueError("Enter a valid email address.")
    return cleaned


def validate_staff_phone(value: str | None) -> str:
    if not value or not value.strip():
        return ""
    return sanitize_optional_text(
        value, field="Phone", max_len=MAX_PHONE_LEN, pattern=_PHONE_PATTERN
    )


def validate_staff_location(value: str | None) -> str:
    if not value or not value.strip():
        return ""
    return sanitize_optional_text(
        value, field="Location", max_len=MAX_LOCATION_LEN, pattern=_LOCATION_PATTERN
    )


def validate_staff_job_title(value: str | None) -> str:
    if not value or not value.strip():
        return ""
    return sanitize_optional_text(
        value, field="Job title", max_len=MAX_JOB_TITLE_LEN, pattern=_JOB_TITLE_PATTERN
    )


def validate_staff_notes(value: str | None) -> str:
    if not value or not value.strip():
        return ""
    cleaned = value.strip()
    cleaned = _reject_control_chars(cleaned, "Notes")
    if len(cleaned) > MAX_NOTES_LEN:
        raise ValueError(f"Notes must be {MAX_NOTES_LEN} characters or fewer.")
    return cleaned


def validate_login_email(value: str) -> str:
    """Login email — stricter length cap, same normalisation."""
    return validate_staff_email(value)


def validate_login_password(value: str) -> str:
    if not value:
        raise ValueError("Password is required.")
    if len(value) > MAX_LOGIN_PASSWORD_LEN:
        raise ValueError(f"Password must be {MAX_LOGIN_PASSWORD_LEN} characters or fewer.")
    _reject_control_chars(value, "Password")
    return value


def validate_staff_status(value: str) -> str:
    status = value.strip().lower()
    if status not in STAFF_STATUSES:
        raise ValueError(f"Status must be one of: {', '.join(sorted(STAFF_STATUSES))}.")
    return status
