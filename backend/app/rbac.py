"""Role and permission helpers."""

from __future__ import annotations

from sqlmodel import Session, select

from app.models import Permission, Role, RolePermission, StaffMember, StaffRoleAssignment
from app.permissions_catalog import SUPER_ADMIN_ROLE_NAME


def staff_role_ids(db: Session, staff_id: str) -> list[str]:
    rows = db.exec(select(StaffRoleAssignment.role_id).where(StaffRoleAssignment.staff_id == staff_id)).all()
    return list(rows)


def staff_roles(db: Session, staff_id: str) -> list[Role]:
    role_ids = staff_role_ids(db, staff_id)
    if not role_ids:
        return []
    return list(db.exec(select(Role).where(Role.id.in_(role_ids))).all())  # type: ignore[attr-defined]


def staff_is_super_admin(db: Session, staff: StaffMember) -> bool:
    for role in staff_roles(db, staff.id):
        if role.is_super_admin:
            return True
    return False


def staff_permissions(db: Session, staff_id: str) -> set[str]:
    role_ids = staff_role_ids(db, staff_id)
    if not role_ids:
        return set()
    perm_rows = db.exec(
        select(RolePermission.permission_id).where(RolePermission.role_id.in_(role_ids))  # type: ignore[attr-defined]
    ).all()
    return set(perm_rows)


def staff_has_permission(db: Session, staff: StaffMember, permission_id: str) -> bool:
    if staff_is_super_admin(db, staff):
        return True
    return permission_id in staff_permissions(db, staff.id)


def get_super_admin_role(db: Session) -> Role | None:
    return db.exec(select(Role).where(Role.name == SUPER_ADMIN_ROLE_NAME)).first()
