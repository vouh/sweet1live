import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session, select

from app.config import settings
from app.database import get_db
from app.models import StaffMember, User

bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expire_hours)
    payload = {"sub": user_id, "exp": expire, "typ": "user"}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def create_staff_token(staff_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expire_hours)
    payload = {"sub": staff_id, "exp": expire, "typ": "staff"}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def _decode_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = _decode_token(credentials.credentials)
        if payload.get("typ") == "staff":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        user_id = payload.get("sub")
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    """Resolve the caller when a token is present, without requiring one.

    Used by checkout and room booking: guests can buy without an account, but a
    signed-in guest gets the order attached to their history.
    """
    if credentials is None or credentials.scheme.lower() != "bearer":
        return None
    try:
        payload = _decode_token(credentials.credentials)
        if payload.get("typ") == "staff":
            return None
    except jwt.PyJWTError:
        return None

    user_id = payload.get("sub")
    # A stale token must not break the insert on the foreign key.
    return db.get(User, user_id) if user_id else None


def get_user_by_email(db: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email.lower())
    return db.exec(statement).first()


def require_staff(x_staff_key: str | None = Header(default=None, alias="X-Staff-Key")) -> None:
    """Gate for staff-only surfaces — the admin API and the door tablet.

    A shared key, not a guest JWT: neither the back office nor the door is a
    guest account. compare_digest keeps the check constant-time.
    """
    if not settings.staff_api_key:
        # An unset key must not read as "wrong key" — that looks like a login
        # problem and sends people hunting in the wrong place.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="STAFF_API_KEY is not configured on the API.",
        )
    if not x_staff_key or not secrets.compare_digest(x_staff_key, settings.staff_api_key):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Staff key required")


def get_staff_from_token(token: str, db: Session) -> StaffMember | None:
    try:
        payload = _decode_token(token)
    except jwt.PyJWTError:
        return None
    if payload.get("typ") != "staff":
        return None
    staff_id = payload.get("sub")
    if not staff_id:
        return None
    staff = db.get(StaffMember, staff_id)
    # Allow-list "active" rather than deny-list a specific bad status: a
    # suspended (or invited-but-not-yet-activated) account's existing JWT
    # must stop working the moment their status changes, not just be blocked
    # from issuing a *new* token at login.
    if staff is None or staff.status != "active":
        return None
    return staff


def get_current_staff(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> StaffMember:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    staff = get_staff_from_token(credentials.credentials, db)
    if staff is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid staff token")
    return staff


def require_staff_access(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    x_staff_key: str | None = Header(default=None, alias="X-Staff-Key"),
    db: Session = Depends(get_db),
) -> StaffMember | None:
    """Staff JWT when present; shared API key as M2M fallback (full access)."""
    if credentials and credentials.scheme.lower() == "bearer":
        staff = get_staff_from_token(credentials.credentials, db)
        if staff:
            return staff
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid staff token")

    if not settings.staff_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="STAFF_API_KEY is not configured on the API.",
        )
    if not x_staff_key or not secrets.compare_digest(x_staff_key, settings.staff_api_key):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Staff authentication required")
    return None


def require_super_admin(staff: StaffMember = Depends(get_current_staff), db: Session = Depends(get_db)) -> StaffMember:
    from app.rbac import staff_is_super_admin

    if not staff_is_super_admin(db, staff):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin required")
    return staff
