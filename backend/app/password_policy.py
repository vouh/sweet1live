"""Shared staff password rules — minimum 8 characters plus complexity."""

from __future__ import annotations

import re

MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 128

# Characters that must never appear in a password field.
_FORBIDDEN_PASSWORD_CHARS = re.compile(r"[\x00-\x1f\x7f]")


def password_issues(password: str) -> list[str]:
    issues: list[str] = []
    if _FORBIDDEN_PASSWORD_CHARS.search(password):
        issues.append("Password contains invalid characters")
    if len(password) > MAX_PASSWORD_LENGTH:
        issues.append(f"No more than {MAX_PASSWORD_LENGTH} characters")
    if len(password) < MIN_PASSWORD_LENGTH:
        issues.append(f"At least {MIN_PASSWORD_LENGTH} characters")
    if not re.search(r"[A-Z]", password):
        issues.append("One uppercase letter")
    if not re.search(r"[a-z]", password):
        issues.append("One lowercase letter")
    if not re.search(r"[0-9]", password):
        issues.append("One number")
    if not re.search(r"[^A-Za-z0-9]", password):
        issues.append("One symbol")
    return issues


def assert_strong_password(password: str) -> None:
    issues = password_issues(password)
    if issues:
        raise ValueError(issues[0])
