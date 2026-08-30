"""Seed or update a test staff account (e.g. for forgot-password email testing).

Usage (from backend/):
    python scripts/seed_test_staff.py peterkelvinkibiru1532@gmail.com
"""

from __future__ import annotations

import sys
import uuid
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from sqlalchemy import inspect, text  # noqa: E402
from sqlmodel import Session, select  # noqa: E402

from app.auth import hash_password  # noqa: E402
from app.config import settings  # noqa: E402
from app.database import engine  # noqa: E402
from app.models import Role, StaffRoleAssignment  # noqa: E402
from app.permissions_catalog import SUPER_ADMIN_ROLE_NAME  # noqa: E402
from app.staff_seed import ensure_super_admin_role, sync_permissions  # noqa: E402
from app.supabase_auth import create_user as supabase_create_user  # noqa: E402

DEFAULT_PASSWORD = "Sweet1ne+1"


def _has_column(table: str, column: str) -> bool:
    return column in {c["name"] for c in inspect(engine).get_columns(table)}


def seed_staff(email: str, *, password: str = DEFAULT_PASSWORD) -> str:
    email = email.strip().lower()
    name = email.split("@")[0].replace(".", " ").title() or "Test Staff"
    pwd_hash = hash_password(password)
    now = datetime.utcnow()

    with engine.begin() as conn:
        row = conn.execute(
            text("SELECT id FROM staff_members WHERE email = :email"),
            {"email": email},
        ).first()

        if row:
            staff_id = row[0]
            conn.execute(
                text(
                    """
                    UPDATE staff_members
                    SET name = :name,
                        password_hash = :password_hash,
                        status = 'active',
                        must_reset_password = false
                    WHERE id = :id
                    """
                ),
                {"id": staff_id, "name": name, "password_hash": pwd_hash},
            )
            print(f"Updated existing staff account: {email}")
        else:
            staff_id = uuid.uuid4().hex
            conn.execute(
                text(
                    """
                    INSERT INTO staff_members (
                        id, email, name, phone, location, job_title, notes,
                        password_hash, status, must_reset_password, created_at
                    )
                    VALUES (
                        :id, :email, :name, '', '', '', '',
                        :password_hash, 'active', false, :created_at
                    )
                    """
                ),
                {
                    "id": staff_id,
                    "email": email,
                    "name": name,
                    "password_hash": pwd_hash,
                    "created_at": now,
                },
            )
            print(f"Created staff account: {email}")

    if _has_column("staff_members", "supabase_user_id"):
        try:
            supabase_id = supabase_create_user(email, password)
            with engine.begin() as conn:
                conn.execute(
                    text("UPDATE staff_members SET supabase_user_id = :sid WHERE id = :id"),
                    {"sid": supabase_id, "id": staff_id},
                )
            print("Linked Supabase Auth user.")
        except Exception as exc:
            print(f"Note: Supabase user not created ({exc}). Forgot-password email still works.")

    with Session(engine) as db:
        sync_permissions(db)
        ensure_super_admin_role(db)
        has_role = db.exec(
            select(StaffRoleAssignment).where(StaffRoleAssignment.staff_id == staff_id)
        ).first()
        if has_role is None:
            role = db.exec(
                select(Role).where(Role.name != SUPER_ADMIN_ROLE_NAME).order_by(Role.name)
            ).first()
            if role:
                db.add(StaffRoleAssignment(staff_id=staff_id, role_id=role.id))
                db.commit()
                print(f"Assigned role: {role.name}")

    return staff_id


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python scripts/seed_test_staff.py <email>")
        return 1
    staff_id = seed_staff(sys.argv[1])
    print(f"Ready for reset-email test — id={staff_id}")
    print(f"Test at /admin/login -> Forgot password -> {sys.argv[1].strip().lower()}")
    if settings.resend_api_key:
        print("Resend is configured — check inbox for the reset link.")
    else:
        print("Resend not configured — reset link is logged by the API only.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
