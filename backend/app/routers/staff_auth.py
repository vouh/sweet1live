"""Staff authentication — login, password reset, invite activation."""

from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import Session, select

from app.auth import get_current_staff
from app.config import settings
from app.audit import record_audit
from app.database import get_db
from app.email import (
    send_staff_invite_email,
    send_staff_password_change_code_email,
    send_staff_reset_email,
)
from app.staff_identity import create_user, set_password, sign_in_with_password
from app.models import (
    StaffAuthResponse,
    StaffChangePasswordConfirm,
    StaffChangePasswordRequest,
    StaffDevPrefill,
    StaffForgotPassword,
    StaffForgotPasswordResponse,
    StaffInvite,
    StaffLogin,
    StaffMember,
    StaffPasswordChangeCode,
    StaffPublic,
    StaffSetPassword,
)
from app.input_validation import (
    validate_login_email,
    validate_login_password,
    validate_staff_email,
    validate_staff_job_title,
    validate_staff_location,
    validate_staff_name,
    validate_staff_notes,
    validate_staff_phone,
    validate_staff_status,
)
from app.password_policy import assert_strong_password
from app.rate_limit import client_ip, enforce_rate_limit
from app.rbac import staff_is_super_admin, staff_permissions, staff_roles
from app.security_log import auth_failure

router = APIRouter(prefix="/auth/staff", tags=["staff-auth"])

INVITE_DAYS = 7
RESET_MINUTES = 5
CHANGE_CODE_MINUTES = 5


def _require_email_sent(sent: bool, *, context: str) -> None:
    if sent:
        return
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=f"Could not send {context}. Email is not configured correctly — contact your administrator.",
    )


def _strong_password(password: str) -> None:
    try:
        assert_strong_password(password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _dev_prefill_enabled() -> bool:
    return settings.dev_login_prefill_enabled


@router.get("/dev-prefill", response_model=StaffDevPrefill)
def staff_dev_prefill(db: Session = Depends(get_db)):
    """Local testing only — prefill login when bootstrap super admin exists in DB."""
    if not _dev_prefill_enabled():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not available.")

    email = (settings.super_admin_email or "").strip().lower()
    password = settings.super_admin_password or ""
    if not email or not password:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not configured.")

    staff = db.exec(select(StaffMember).where(StaffMember.email == email)).first()
    if staff is None or staff.status != "active":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")

    return StaffDevPrefill(email=email, password=password)


def _serialize_staff(db: Session, staff: StaffMember) -> StaffPublic:
    roles = staff_roles(db, staff.id)
    perms = sorted(staff_permissions(db, staff.id))
    return StaffPublic(
        id=staff.id,
        email=staff.email,
        name=staff.name,
        phone=staff.phone or "",
        location=staff.location or "",
        job_title=staff.job_title or "",
        notes=staff.notes or "",
        status=staff.status,
        must_reset_password=staff.must_reset_password,
        is_super_admin=staff_is_super_admin(db, staff),
        roles=[role.name for role in roles],
        permissions=perms,
        created_at=staff.created_at,
    )


@router.post("/login", response_model=StaffAuthResponse)
def staff_login(payload: StaffLogin, request: Request, db: Session = Depends(get_db)):
    try:
        email = validate_login_email(payload.email)
        password = validate_login_password(payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    enforce_rate_limit(f"login-ip:{client_ip(request)}", limit=20, window_seconds=15 * 60)
    enforce_rate_limit(f"login-email:{email}", limit=6, window_seconds=15 * 60)

    staff = db.exec(select(StaffMember).where(StaffMember.email == email)).first()
    if staff is None or staff.identity_id is None:
        auth_failure(ip=client_ip(request), endpoint="/auth/staff/login", reason="invalid_credentials")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if staff.status in ("disabled", "suspended"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account suspended")
    if staff.must_reset_password:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must set a new password using your invite link before signing in.",
        )

    # Credential check itself happens with the auth provider — it raises 401
    # on a bad password without telling us anything more specific than that.
    try:
        access_token, _identity_id = sign_in_with_password(email, password)
    except HTTPException:
        auth_failure(ip=client_ip(request), endpoint="/auth/staff/login", reason="invalid_credentials")
        raise
    record_audit(db, action="staff.login", actor=staff, target="Staff portal", ip_address=client_ip(request))
    return StaffAuthResponse(
        access_token=access_token,
        staff=_serialize_staff(db, staff),
    )


@router.get("/me", response_model=StaffPublic)
def staff_me(staff: StaffMember = Depends(get_current_staff), db: Session = Depends(get_db)):
    return _serialize_staff(db, staff)


@router.post("/change-password/request")
def staff_change_password_request(
    payload: StaffChangePasswordRequest,
    staff: StaffMember = Depends(get_current_staff),
    db: Session = Depends(get_db),
):
    """Starts a password change for the signed-in staff member.

    Only validates the new password and emails a code here — nothing is
    stored or applied until that code is confirmed (with the password
    supplied again), so a hijacked/left-open session can't silently change
    credentials without the real owner seeing it land in their inbox.
    """
    enforce_rate_limit(f"change-pw-request:{staff.id}", limit=3, window_seconds=60 * 60)
    _strong_password(payload.new_password)

    # Only one code should ever be redeemable at a time — invalidate any
    # earlier unused request before issuing a new one.
    stale = db.exec(
        select(StaffPasswordChangeCode)
        .where(StaffPasswordChangeCode.staff_id == staff.id)
        .where(StaffPasswordChangeCode.used_at.is_(None))
    ).all()
    for row in stale:
        row.used_at = datetime.utcnow()
        db.add(row)

    code = f"{secrets.randbelow(1_000_000):06d}"
    db.add(
        StaffPasswordChangeCode(
            staff_id=staff.id,
            code_hash=_token_hash(code),
            expires_at=datetime.utcnow() + timedelta(minutes=CHANGE_CODE_MINUTES),
        )
    )
    db.commit()
    sent = send_staff_password_change_code_email(to=staff.email, code=code)
    _require_email_sent(sent, context="confirmation code")
    return {"message": "A confirmation code has been sent to your email."}


@router.post("/change-password/confirm")
def staff_change_password_confirm(
    payload: StaffChangePasswordConfirm,
    staff: StaffMember = Depends(get_current_staff),
    db: Session = Depends(get_db),
):
    # A 6-digit code is only ~1M possibilities — this cap is what actually
    # makes it safe to guess against, not the code's length alone.
    enforce_rate_limit(f"change-pw-confirm:{staff.id}", limit=5, window_seconds=15 * 60)
    _strong_password(payload.new_password)

    code_hash = _token_hash(payload.code.strip())
    pending = db.exec(
        select(StaffPasswordChangeCode)
        .where(StaffPasswordChangeCode.staff_id == staff.id)
        .where(StaffPasswordChangeCode.used_at.is_(None))
        .order_by(StaffPasswordChangeCode.created_at.desc())
    ).first()

    if pending is None or pending.code_hash != code_hash or pending.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired code.")
    if staff.identity_id is None:
        raise HTTPException(status_code=400, detail="This account has no password set yet.")

    set_password(staff.identity_id, payload.new_password)
    pending.used_at = datetime.utcnow()
    db.add(pending)
    db.commit()
    return {"message": "Password updated."}


@router.post("/set-password")
def staff_set_password(payload: StaffSetPassword, request: Request, db: Session = Depends(get_db)):
    # The token itself is 256 bits of randomness — infeasible to brute force —
    # but a per-IP cap costs nothing and blunts a scripted flood regardless.
    enforce_rate_limit(f"set-password-ip:{client_ip(request)}", limit=20, window_seconds=60 * 60)
    _strong_password(payload.password)
    token_hash = _token_hash(payload.token)
    invite = db.exec(select(StaffInvite).where(StaffInvite.token_hash == token_hash)).first()
    if invite is None or invite.used_at is not None or invite.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired link.")

    staff = db.get(StaffMember, invite.staff_id)
    if staff is None:
        raise HTTPException(status_code=400, detail="Invalid or expired link.")

    # First time this account sets a password (a brand-new invite, or an
    # existing account migrated from local auth) → create it with the auth
    # provider now. Otherwise this is a reset — just rotate the password there.
    if staff.identity_id is None:
        staff.identity_id = create_user(staff.email, payload.password)
    else:
        set_password(staff.identity_id, payload.password)

    staff.must_reset_password = False
    staff.status = "active"
    invite.used_at = datetime.utcnow()
    db.add(staff)
    db.add(invite)
    db.commit()
    record_audit(db, action="password.updated", actor=staff, target=staff.email, ip_address=client_ip(request))
    return {"message": "Password updated. You can sign in now."}


@router.post("/forgot-password", response_model=StaffForgotPasswordResponse)
def staff_forgot_password(
    payload: StaffForgotPassword, request: Request, db: Session = Depends(get_db)
):
    try:
        email = validate_login_email(payload.email)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    enforce_rate_limit(f"forgot-ip:{client_ip(request)}", limit=10, window_seconds=60 * 60)
    enforce_rate_limit(f"forgot-email:{email}", limit=3, window_seconds=60 * 60)

    staff = db.exec(select(StaffMember).where(StaffMember.email == email)).first()
    if staff is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No staff account exists with that email. Check the address and try again.",
        )
    if staff.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is suspended. Contact your administrator.",
        )
    if staff.status == "disabled":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No staff account exists with that email. Check the address and try again.",
        )

    token = secrets.token_urlsafe(32)
    invite = StaffInvite(
        staff_id=staff.id,
        token_hash=_token_hash(token),
        expires_at=datetime.utcnow() + timedelta(minutes=RESET_MINUTES),
    )
    db.add(invite)
    db.commit()

    reset_url = f"{settings.public_site_url.rstrip('/')}/admin/access/{token}"
    sent = send_staff_reset_email(to=staff.email, reset_url=reset_url)
    _require_email_sent(sent, context="reset link")
    record_audit(
        db,
        action="password.reset_link_sent",
        actor_email=staff.email,
        target=staff.email,
        ip_address=client_ip(request),
    )
    return StaffForgotPasswordResponse(message="Reset link sent. Check your inbox.")


def create_staff_invite(
    db: Session,
    staff: StaffMember,
    temp_password: str,
) -> tuple[str, str]:
    """Create invite token and send email. Returns (token, invite_url)."""
    token = secrets.token_urlsafe(32)
    db.add(
        StaffInvite(
            staff_id=staff.id,
            token_hash=_token_hash(token),
            expires_at=datetime.utcnow() + timedelta(days=INVITE_DAYS),
        )
    )
    db.commit()
    invite_url = f"{settings.public_site_url.rstrip('/')}/admin/access/{token}"
    sent = send_staff_invite_email(
        to=staff.email,
        name=staff.name,
        invite_url=invite_url,
        temp_password=temp_password,
    )
    _require_email_sent(sent, context="invite email")
    return token, invite_url
