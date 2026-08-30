"""Permission checks for admin API routes."""

from __future__ import annotations

from fastapi import Depends, HTTPException, status
from sqlmodel import Session

from app.auth import require_staff_access
from app.database import get_db
from app.models import StaffMember
from app.rbac import staff_has_permission, staff_is_super_admin


def require_permission(permission_id: str):
    """Factory — super admin and API-key callers bypass; staff JWT must hold the permission."""

    def _check(
        staff: StaffMember | None = Depends(require_staff_access),
        db: Session = Depends(get_db),
    ) -> None:
        if staff is None:
            return
        if staff_is_super_admin(db, staff):
            return
        if not staff_has_permission(db, staff, permission_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission_id}",
            )

    return Depends(_check)
