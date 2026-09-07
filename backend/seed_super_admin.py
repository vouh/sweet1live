"""Provision a Supabase Auth super admin; password is read from stdin or a hidden prompt."""
import argparse
import getpass
import sys

import httpx
from sqlmodel import Session, select

from app.database import engine
from app.models import StaffMember, StaffRoleAssignment
from app.staff_identity import _admin_headers, _auth_url, create_user, set_password, sign_in_with_password
from app.staff_seed import ensure_super_admin_role, sync_permissions


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("email")
    parser.add_argument("--name", default="Super Admin")
    args = parser.parse_args()
    email = args.email.strip().lower()
    password = getpass.getpass("Password: ") if sys.stdin.isatty() else sys.stdin.readline().rstrip("\r\n")
    if not password:
        raise SystemExit("Password is required")
    identity_id = None
    page = 1
    while True:
        response = httpx.get(_auth_url("admin/users"), headers=_admin_headers(), params={"page": page, "per_page": 100}, timeout=30)
        if response.status_code != 200:
            raise SystemExit(f"Auth user lookup failed (HTTP {response.status_code})")
        users = response.json().get("users", [])
        identity_id = next((u["id"] for u in users if (u.get("email") or "").lower() == email), None)
        if identity_id or len(users) < 100:
            break
        page += 1
    if identity_id:
        set_password(identity_id, password)
    else:
        identity_id = create_user(email, password)
    _, authenticated_id = sign_in_with_password(email, password)
    if authenticated_id != identity_id:
        raise SystemExit("Auth identity mismatch")
    with Session(engine) as db:
        sync_permissions(db)
        role = ensure_super_admin_role(db)
        staff = db.exec(select(StaffMember).where(StaffMember.email == email)).first()
        if staff is None:
            staff = StaffMember(email=email, name=args.name, password_hash="")
        staff.identity_id = identity_id
        staff.password_hash = ""
        staff.status = "active"
        staff.must_reset_password = False
        db.add(staff)
        db.flush()
        assignment = db.exec(select(StaffRoleAssignment).where(StaffRoleAssignment.staff_id == staff.id, StaffRoleAssignment.role_id == role.id)).first()
        if assignment is None:
            db.add(StaffRoleAssignment(staff_id=staff.id, role_id=role.id))
        db.commit()
    print(f"Supabase Auth login verified; Super Admin provisioned: {email}")


if __name__ == "__main__":
    main()
