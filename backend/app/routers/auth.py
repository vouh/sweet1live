from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import Session

from app.auth import create_access_token, get_current_user, get_user_by_email, hash_password, verify_password
from app.database import get_db
from app.models import AuthResponse, User, UserLogin, UserPublic, UserRegister
from app.rate_limit import client_ip, enforce_rate_limit
from app.security_log import auth_failure

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(payload: UserRegister, request: Request, db: Session = Depends(get_db)):
    ip = client_ip(request)
    enforce_rate_limit(f"register-ip:{ip}", limit=10, window_seconds=60 * 60)
    enforce_rate_limit(f"register-email:{payload.email.lower()}", limit=3, window_seconds=60 * 60)

    email = payload.email.lower()
    if get_user_by_email(db, email):
        auth_failure(ip=ip, endpoint="/auth/register", reason="email_taken")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        name=payload.name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return AuthResponse(
        access_token=create_access_token(user.id),
        user=UserPublic.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
    ip = client_ip(request)
    email = payload.email.lower()
    enforce_rate_limit(f"login-ip:{ip}", limit=20, window_seconds=15 * 60)
    enforce_rate_limit(f"login-email:{email}", limit=8, window_seconds=15 * 60)

    user = get_user_by_email(db, email)
    if user is None or not verify_password(payload.password, user.password_hash):
        auth_failure(ip=ip, endpoint="/auth/login", reason="invalid_credentials")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    return AuthResponse(
        access_token=create_access_token(user.id),
        user=UserPublic.model_validate(user),
    )


@router.get("/me", response_model=UserPublic)
def me(user: User = Depends(get_current_user)):
    return UserPublic.model_validate(user)
