"""Bootstrap permissions, super-admin role, and optional first super-admin account."""

from __future__ import annotations

import logging

from fastapi import HTTPException
from sqlmodel import Session, select

from app.auth import hash_password
from app.config import settings
from app.models import Permission, Role, RolePermission, StaffMember, StaffRoleAssignment
from app.permissions_catalog import PERMISSIONS, SUPER_ADMIN_ROLE_NAME
from app.staff_identity import create_user, set_password

logger = logging.getLogger(__name__)


def sync_permissions(db: Session) -> None:
    existing = {row.id for row in db.exec(select(Permission)).all()}
    for item in PERMISSIONS:
        if item.id in existing:
            continue
        db.add(
            Permission(
                id=item.id,
                category=item.category,
                label=item.label,
                sort_order=item.sort_order,
            )
        )
    db.commit()


def ensure_super_admin_role(db: Session) -> Role:
    role = db.exec(select(Role).where(Role.name == SUPER_ADMIN_ROLE_NAME)).first()
    if role is None:
        role = Role(name=SUPER_ADMIN_ROLE_NAME, is_super_admin=True)
        db.add(role)
        db.commit()
        db.refresh(role)

    assigned = {
        row.permission_id
        for row in db.exec(select(RolePermission).where(RolePermission.role_id == role.id)).all()
    }
    for item in PERMISSIONS:
        if item.id in assigned:
            continue
        db.add(RolePermission(role_id=role.id, permission_id=item.id))
    db.commit()
    return role


def bootstrap_super_admin(db: Session) -> StaffMember | None:
    email = (settings.super_admin_email or "").strip().lower()
    if not email:
        return None

    staff = db.exec(select(StaffMember).where(StaffMember.email == email)).first()
    role = ensure_super_admin_role(db)

    if staff is None:
        password = settings.super_admin_password or "ChangeMeNow!1"
        staff = StaffMember(
            email=email,
            name=settings.super_admin_name or "Super Admin",
            password_hash=hash_password(password),
            status="active",
            must_reset_password=not bool(settings.super_admin_password),
        )
        db.add(staff)
        db.commit()
        db.refresh(staff)
        logger.info("Created bootstrap super admin %s", email)
    elif settings.super_admin_password:
        # Keep dev login in sync with `.env.local` when password is set there.
        staff.password_hash = hash_password(settings.super_admin_password)
        staff.must_reset_password = False
        if staff.status != "active":
            staff.status = "active"
        db.add(staff)
        db.commit()
        db.refresh(staff)

    # Staff sign-in now goes through the external auth provider — make sure
    # this account actually exists there too. Non-fatal if it isn't
    # configured yet (e.g. a fresh local checkout): the account just can't
    # log in until it is.
    try:
        if staff.identity_id is None:
            password = settings.super_admin_password or "ChangeMeNow!1"
            staff.identity_id = create_user(staff.email, password)
            db.add(staff)
            db.commit()
        elif settings.super_admin_password:
            set_password(staff.identity_id, settings.super_admin_password)
    except HTTPException as exc:
        logger.warning("Could not sync bootstrap super admin with the auth provider: %s", exc.detail)

    has_role = db.exec(
        select(StaffRoleAssignment).where(
            StaffRoleAssignment.staff_id == staff.id,
            StaffRoleAssignment.role_id == role.id,
        )
    ).first()
    if has_role is None:
        db.add(StaffRoleAssignment(staff_id=staff.id, role_id=role.id))
        db.commit()

    return staff


def init_rbac(db: Session) -> None:
    sync_permissions(db)
    ensure_super_admin_role(db)
    bootstrap_super_admin(db)
