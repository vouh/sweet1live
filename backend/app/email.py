"""Transactional email via Resend."""

from __future__ import annotations

import base64
import logging
from html import escape
from pathlib import Path

import httpx

from app.config import settings
from app.email_templates import EMAIL_LOGO_CONTENT_ID, branded_email, code_block

logger = logging.getLogger(__name__)
_LOGO_PATH = Path(__file__).resolve().parents[2] / "public" / "images" / "logo.png"


def send_staff_invite_email(*, to: str, name: str, invite_url: str, temp_password: str) -> bool:
    subject = "You're invited to Sweet1ne Live staff"
    body = f"""
    <p>Hi <strong style="color:#f7f3ea;">{escape(name)}</strong>,</p>
    <p>You&apos;ve been invited to the Sweet1ne Live staff portal.</p>
    <p>Your temporary password is:</p>
    {code_block(temp_password)}
    <p>Set a strong password to activate your account. This invite link expires in <strong style="color:#d8b632;">7 days</strong>.</p>
    """
    html = branded_email(
        eyebrow="Staff invite",
        title="Welcome to the team",
        body_html=body,
        cta_href=invite_url,
        cta_label="Set your password",
    )
    return _send(to=to, subject=subject, html=html)


def send_staff_reset_email(*, to: str, reset_url: str) -> bool:
    subject = "Reset your Sweet1ne staff password"
    body = """
    <p>You asked to reset your Sweet1ne Live staff password.</p>
    <p>Use the button below to choose a new password. This link expires in <strong style="color:#d8b632;">5 minutes</strong>.</p>
    <p>If you didn&apos;t request this, you can ignore this email — your password will stay as it is.</p>
    """
    html = branded_email(
        eyebrow="Password reset",
        title="Choose a new password",
        body_html=body,
        cta_href=reset_url,
        cta_label="Reset password",
    )
    return _send(to=to, subject=subject, html=html)


def send_staff_password_change_code_email(*, to: str, code: str) -> bool:
    subject = "Confirm your Sweet1ne password change"
    body = f"""
    <p>Someone signed in to your Sweet1ne Live staff account just asked to change its password.</p>
    <p>Enter this confirmation code in the portal:</p>
    {code_block(code)}
    <p>This code expires in <strong style="color:#d8b632;">5 minutes</strong>. If you didn&apos;t request this, ignore this email and consider signing out of any device you don&apos;t recognise.</p>
    """
    html = branded_email(
        eyebrow="Security",
        title="Confirm password change",
        body_html=body,
    )
    return _send(to=to, subject=subject, html=html)


def _send(*, to: str, subject: str, html: str) -> bool:
    if not settings.resend_api_key:
        logger.info("[email] Resend not configured — would send to %s: %s", to, subject)
        return False

    from_address = settings.resend_from or "Sweet1ne Live <onboarding@resend.dev>"
    try:
        logo_content = base64.b64encode(_LOGO_PATH.read_bytes()).decode("ascii")
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": from_address,
                "to": [to],
                "subject": subject,
                "html": html,
                "attachments": [
                    {
                        "content": logo_content,
                        "filename": "sweet1ne-logo.png",
                        "content_id": EMAIL_LOGO_CONTENT_ID,
                    }
                ],
            },
            timeout=15.0,
        )
        if response.status_code >= 400:
            logger.error("[email] Resend error %s: %s", response.status_code, response.text)
            return False
        return True
    except Exception:
        logger.exception("[email] Resend request failed")
        return False
