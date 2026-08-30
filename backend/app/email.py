"""Transactional email via Resend."""

from __future__ import annotations

import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


def send_staff_invite_email(*, to: str, name: str, invite_url: str, temp_password: str) -> bool:
    subject = "You're invited to Sweet1ne Live staff"
    html = f"""
    <p>Hi {name},</p>
    <p>You've been invited to the Sweet1ne Live staff portal.</p>
    <p>Your temporary password is: <strong>{temp_password}</strong></p>
    <p><a href="{invite_url}">Set your password and activate your account</a></p>
    <p>This link expires in 7 days. You'll need a strong password before you can sign in.</p>
    """
    return _send(to=to, subject=subject, html=html)


def send_staff_reset_email(*, to: str, reset_url: str) -> bool:
    subject = "Reset your Sweet1ne staff password"
    html = f"""
    <p>You asked to reset your Sweet1ne Live staff password.</p>
    <p><a href="{reset_url}">Choose a new password</a></p>
    <p>This link expires in 5 minutes. If you didn't request it, you can ignore this email.</p>
    """
    return _send(to=to, subject=subject, html=html)


def send_staff_password_change_code_email(*, to: str, code: str) -> bool:
    subject = "Confirm your Sweet1ne password change"
    html = f"""
    <p>Someone signed in to your Sweet1ne Live staff account just asked to change its password.</p>
    <p>Your confirmation code is: <strong style="font-size:20px;letter-spacing:2px;">{code}</strong></p>
    <p>This code expires in 5 minutes. If you didn't request this, ignore this email and your
    password will stay as it is — but consider signing out of any device you don't recognise.</p>
    """
    return _send(to=to, subject=subject, html=html)


def _send(*, to: str, subject: str, html: str) -> bool:
    if not settings.resend_api_key:
        logger.info("[email] Resend not configured — would send to %s: %s", to, subject)
        return False

    from_address = settings.resend_from or "Sweet1ne Live <onboarding@resend.dev>"
    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
            },
            json={"from": from_address, "to": [to], "subject": subject, "html": html},
            timeout=15.0,
        )
        if response.status_code >= 400:
            logger.error("[email] Resend error %s: %s", response.status_code, response.text)
            return False
        return True
    except Exception:
        logger.exception("[email] Resend request failed")
        return False
