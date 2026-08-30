"""Branded HTML email layouts — Nocturne & Gold (see docs/DESIGN.md)."""

from __future__ import annotations

from html import escape

from app.config import settings

# Design tokens (docs/DESIGN.md + staff login chocolate/cream accents)
_BG = "#131313"
_SURFACE = "#201f1f"
_IVORY = "#f7f3ea"
_GOLD = "#d8b632"
_GOLD_DIM = "#d4a574"
_INK = "#2c1810"
_ACCENT = "#c45c3a"
_MUTED = "rgba(247, 243, 234, 0.65)"
_BORDER = "rgba(216, 182, 50, 0.28)"


EMAIL_LOGO_CONTENT_ID = "sweet1ne-logo"


def _cta_button(href: str, label: str) -> str:
    safe_href = escape(href, quote=True)
    safe_label = escape(label)
    return f"""
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 8px;">
      <tr>
        <td align="center" style="border-radius:9999px;background:{_GOLD};">
          <a href="{safe_href}" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;text-decoration:none;color:{_INK};">
            {safe_label}
          </a>
        </td>
      </tr>
    </table>
    """


def branded_email(*, eyebrow: str, title: str, body_html: str, cta_href: str | None = None, cta_label: str | None = None) -> str:
    """Wrap transactional content in the Sweet1ne Live email shell."""
    eyebrow_safe = escape(eyebrow)
    title_safe = escape(title)
    cta = _cta_button(cta_href, cta_label) if cta_href and cta_label else ""
    site = escape(settings.public_site_url.rstrip("/"), quote=True)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title_safe}</title>
</head>
<body style="margin:0;padding:0;background:{_BG};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{_BG};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:{_SURFACE};border:1px solid {_BORDER};border-radius:12px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:36px 32px 28px;background:linear-gradient(180deg,#2c1810 0%,#1a100c 100%);">
              <img src="cid:{EMAIL_LOGO_CONTENT_ID}" alt="Sweet1ne Live" width="200" style="display:block;max-width:200px;height:auto;margin:0 auto 8px;" />
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.35em;text-transform:uppercase;color:{_GOLD_DIM};">Live</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 24px;font-family:Georgia,'Times New Roman',serif;color:{_IVORY};">
              <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:{_GOLD_DIM};">{eyebrow_safe}</p>
              <h1 style="margin:0 0 20px;font-size:28px;font-weight:400;line-height:1.2;color:{_IVORY};">{title_safe}</h1>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:{_MUTED};">
                {body_html}
              </div>
              {cta}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid {_BORDER};font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;text-align:center;color:rgba(247,243,234,0.45);">
              Sweet1ne Live · 218 High Road, Chadwell Heath, RM6 6LS<br />
              <a href="{site}" style="color:{_GOLD_DIM};text-decoration:none;">{site.replace("https://", "").replace("http://", "")}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def code_block(code: str) -> str:
    safe = escape(code)
    return f"""
    <p style="margin:24px 0 8px;text-align:center;">
      <span style="display:inline-block;padding:16px 28px;border:1px solid {_BORDER};border-radius:8px;background:#111111;font-family:monospace;font-size:28px;font-weight:700;letter-spacing:0.2em;color:{_GOLD};">{safe}</span>
    </p>
    """
