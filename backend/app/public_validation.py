"""Validation for guest-facing enquiry and reservation forms."""

from __future__ import annotations

import re
from datetime import date

from app.input_validation import (
    MAX_NAME_LEN,
    MAX_NOTES_LEN,
    _CONTROL_CHARS,
    _NAME_PATTERN,
    sanitize_optional_text,
    validate_staff_email,
)

MAX_SUBJECT_LEN = 200
MAX_MESSAGE_LEN = 4000
MAX_DETAILS_LEN = 4000
MAX_TIME_LEN = 8

_TIME_PATTERN = re.compile(r"^\d{2}:\d{2}$")
_SUBJECT_PATTERN = re.compile(r"^[\w\s.,'\-/!?&#()]+$", re.UNICODE)

VENUE_EVENT_TYPES = frozenset({"corporate", "birthday", "private-dinner", "other"})


def validate_public_name(value: str) -> str:
    return sanitize_optional_text(
        value, field="Name", max_len=MAX_NAME_LEN, pattern=_NAME_PATTERN, allow_empty=False
    )


def validate_public_email(value: str) -> str:
    return validate_staff_email(value)


def validate_public_notes(value: str | None, *, field: str = "Notes", max_len: int = MAX_NOTES_LEN) -> str | None:
    if value is None or not str(value).strip():
        return None
    cleaned = str(value).strip()
    if _CONTROL_CHARS.search(cleaned):
        raise ValueError(f"{field} contains invalid characters.")
    if len(cleaned) > max_len:
        raise ValueError(f"{field} must be {max_len} characters or fewer.")
    return cleaned


def validate_reservation_time(value: str) -> str:
    cleaned = sanitize_optional_text(value, field="Time", max_len=MAX_TIME_LEN, allow_empty=False)
    if not _TIME_PATTERN.match(cleaned):
        raise ValueError("Time must be in HH:MM format.")
    return cleaned


def validate_reservation_date(value: date) -> date:
    if value < date.today():
        raise ValueError("Date must be today or in the future.")
    return value


def validate_party_size(value: int) -> int:
    if value < 1 or value > 20:
        raise ValueError("Party size must be between 1 and 20.")
    return value


def validate_contact_subject(value: str) -> str:
    return sanitize_optional_text(
        value, field="Subject", max_len=MAX_SUBJECT_LEN, pattern=_SUBJECT_PATTERN, allow_empty=False
    )


def validate_contact_message(value: str) -> str:
    cleaned = str(value).strip()
    if not cleaned:
        raise ValueError("Message is required.")
    if _CONTROL_CHARS.search(cleaned):
        raise ValueError("Message contains invalid characters.")
    if len(cleaned) > MAX_MESSAGE_LEN:
        raise ValueError(f"Message must be {MAX_MESSAGE_LEN} characters or fewer.")
    return cleaned


def validate_venue_event_type(value: str) -> str:
    cleaned = value.strip().lower()
    if cleaned not in VENUE_EVENT_TYPES:
        raise ValueError("Invalid event type.")
    return cleaned


def validate_guest_count(value: int) -> int:
    if value < 1 or value > 500:
        raise ValueError("Guest count must be between 1 and 500.")
    return value


def validate_venue_details(value: str | None) -> str | None:
    return validate_public_notes(value, field="Details", max_len=MAX_DETAILS_LEN)
