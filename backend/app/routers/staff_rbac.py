"""Super-admin settings: roles, permissions, staff accounts."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.auth import hash_password, require_super_admin
from app.database import get_db
from app.models import (
    BulkDeleteResult,
    Permission,
    PermissionPublic,
    Role,
    RoleCreate,
    RolePermission,
    RolePublic,
    RoleUpdate,
    StaffBulkDelete,
    StaffCreate,
    StaffInvite,
    StaffMember,
    StaffPublic,
    StaffRoleAssignment,
    StaffUpdate,
)
from app.input_validation import (
    validate_staff_email,
    validate_staff_job_title,
    validate_staff_location,
    validate_staff_name,
    validate_staff_notes,
    validate_staff_phone,
    validate_staff_status,
)
from app.password_policy import assert_strong_password
from app.permissions_catalog import SUPER_ADMIN_ROLE_NAME
from app.rbac import get_super_admin_role, staff_is_super_admin, staff_roles
from app.routers.staff_auth import _serialize_staff, create_staff_invite

router = APIRouter(prefix="/admin/rbac", tags=["admin-rbac"])


def _validation_error(exc: ValueError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))


def _guard_super_admin_target(db: Session, staff: StaffMember, actor: StaffMember, action: str) -> None:
    if staff.promoted_by_id == actor.id and staff_is_super_admin(db, staff):
        raise HTTPException(
            status_code=400,
            detail=f"You cannot {action} the account that granted you super admin.",
        )


@router.get("/staff/{staff_id}", response_model=StaffPublic)
def get_staff(staff_id: str, db: Session = Depends(get_db), _: StaffMember = Depends(require_super_admin)):
    staff = db.get(StaffMember, staff_id)
    if staff is None:
        raise HTTPException(status_code=404, detail="Staff member not found.")
    return _serialize_staff(db, staff)


def _role_public(db: Session, role: Role) -> RolePublic:
    perm_ids = list(
        db.exec(select(RolePermission.permission_id).where(RolePermission.role_id == role.id)).all()
    )
    assignments = db.exec(
        select(StaffRoleAssignment.staff_id).where(StaffRoleAssignment.role_id == role.id)
    ).all()
    member_emails: list[str] = []
    for staff_id in assignments:
        staff = db.get(StaffMember, staff_id)
        if staff:
            member_emails.append(staff.email)
    return RolePublic(
        id=role.id,
        name=role.name,
        is_super_admin=role.is_super_admin,
        permission_ids=perm_ids,
        member_emails=sorted(member_emails),
        created_at=role.created_at,
    )


@router.get("/permissions", response_model=list[PermissionPublic])
def list_permissions(
    db: Session = Depends(get_db),
    _: StaffMember = Depends(require_super_admin),
):
    rows = db.exec(select(Permission).order_by(Permission.sort_order, Permission.id)).all()
    return [PermissionPublic.model_validate(row) for row in rows]


@router.get("/roles", response_model=list[RolePublic])
def list_roles(
    db: Session = Depends(get_db),
    _: StaffMember = Depends(require_super_admin),
):
    roles = db.exec(select(Role).order_by(Role.name)).all()
    return [_role_public(db, role) for role in roles]


@router.post("/roles", response_model=RolePublic, status_code=201)
def create_role(
    payload: RoleCreate,
    db: Session = Depends(get_db),
    _: StaffMember = Depends(require_super_admin),
):
    name = payload.name.strip()
    if db.exec(select(Role).where(Role.name == name)).first():
        raise HTTPException(status_code=409, detail="A role with that name already exists.")
    if name.lower() == SUPER_ADMIN_ROLE_NAME.lower():
        raise HTTPException(status_code=400, detail="Use staff assignment to grant super admin.")

    role = Role(name=name)
    db.add(role)
    db.commit()
    db.refresh(role)

    for perm_id in payload.permission_ids:
        if db.get(Permission, perm_id):
            db.add(RolePermission(role_id=role.id, permission_id=perm_id))
    db.commit()
    return _role_public(db, role)


@router.patch("/roles/{role_id}", response_model=RolePublic)
def update_role(
    role_id: str,
    payload: RoleUpdate,
    db: Session = Depends(get_db),
    actor: StaffMember = Depends(require_super_admin),
):
    role = db.get(Role, role_id)
    if role is None:
        raise HTTPException(status_code=404, detail="Role not found.")
    if role.is_super_admin:
        raise HTTPException(status_code=400, detail="The super admin role cannot be edited.")

    if payload.name is not None:
        name = payload.name.strip()
        taken = db.exec(select(Role).where(Role.name == name, Role.id != role_id)).first()
        if taken:
            raise HTTPException(status_code=409, detail="A role with that name already exists.")
        role.name = name

    if payload.permission_ids is not None:
        for row in db.exec(select(RolePermission).where(RolePermission.role_id == role_id)).all():
            db.delete(row)
        for perm_id in payload.permission_ids:
            if db.get(Permission, perm_id):
                db.add(RolePermission(role_id=role_id, permission_id=perm_id))

    if payload.member_emails is not None:
        for row in db.exec(select(StaffRoleAssignment).where(StaffRoleAssignment.role_id == role_id)).all():
            db.delete(row)
        for raw_email in payload.member_emails:
            email = raw_email.strip().lower()
            staff = db.exec(select(StaffMember).where(StaffMember.email == email)).first()
            if staff is None:
                raise HTTPException(status_code=400, detail=f"No staff account for {email}.")
            db.add(StaffRoleAssignment(staff_id=staff.id, role_id=role_id))

    db.add(role)
    db.commit()
    db.refresh(role)
    return _role_public(db, role)


@router.delete("/roles/{role_id}", status_code=204)
def delete_role(
    role_id: str,
    db: Session = Depends(get_db),
    _: StaffMember = Depends(require_super_admin),
):
    role = db.get(Role, role_id)
    if role is None:
        raise HTTPException(status_code=404, detail="Role not found.")
    if role.is_super_admin:
        raise HTTPException(status_code=400, detail="The super admin role cannot be deleted.")

    for row in db.exec(select(RolePermission).where(RolePermission.role_id == role_id)).all():
        db.delete(row)
    for row in db.exec(select(StaffRoleAssignment).where(StaffRoleAssignment.role_id == role_id)).all():
        db.delete(row)
    db.delete(role)
    db.commit()


@router.get("/staff", response_model=list[StaffPublic])
def list_staff(
    db: Session = Depends(get_db),
    _: StaffMember = Depends(require_super_admin),
):
    rows = db.exec(select(StaffMember).order_by(StaffMember.created_at.desc())).all()
    return [_serialize_staff(db, row) for row in rows]


@router.post("/staff", response_model=StaffPublic, status_code=201)
def create_staff(
    payload: StaffCreate,
    db: Session = Depends(get_db),
    actor: StaffMember = Depends(require_super_admin),
):
    try:
        email = validate_staff_email(payload.email)
        name = validate_staff_name(payload.name)
        phone = validate_staff_phone(payload.phone)
        location = validate_staff_location(payload.location)
        job_title = validate_staff_job_title(payload.job_title)
        notes = validate_staff_notes(payload.notes)
    except ValueError as exc:
        raise _validation_error(exc) from exc

    if db.exec(select(StaffMember).where(StaffMember.email == email)).first():
        raise HTTPException(status_code=409, detail="That email is already registered.")

    if not payload.send_invite:
        try:
            assert_strong_password(payload.temp_password)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    staff = StaffMember(
        email=email,
        name=name,
        phone=phone,
        location=location,
        job_title=job_title,
        notes=notes,
        password_hash=hash_password(payload.temp_password),
        status="invited" if payload.send_invite else "active",
        must_reset_password=payload.send_invite,
        invited_by_id=actor.id,
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)

    for role_id in payload.role_ids:
        if db.get(Role, role_id):
            db.add(StaffRoleAssignment(staff_id=staff.id, role_id=role_id))

    if payload.grant_super_admin:
        super_role = get_super_admin_role(db)
        if super_role:
            db.add(StaffRoleAssignment(staff_id=staff.id, role_id=super_role.id))
            staff.promoted_by_id = actor.id

    db.commit()
    if payload.send_invite:
        create_staff_invite(db, staff, payload.temp_password)
    return _serialize_staff(db, staff)


@router.patch("/staff/{staff_id}", response_model=StaffPublic)
def update_staff(
    staff_id: str,
    payload: StaffUpdate,
    db: Session = Depends(get_db),
    actor: StaffMember = Depends(require_super_admin),
):
    staff = db.get(StaffMember, staff_id)
    if staff is None:
        raise HTTPException(status_code=404, detail="Staff member not found.")

    try:
        if payload.name is not None:
            staff.name = validate_staff_name(payload.name)
        if payload.phone is not None:
            staff.phone = validate_staff_phone(payload.phone)
        if payload.location is not None:
            staff.location = validate_staff_location(payload.location)
        if payload.job_title is not None:
            staff.job_title = validate_staff_job_title(payload.job_title)
        if payload.notes is not None:
            staff.notes = validate_staff_notes(payload.notes)
        if payload.status is not None:
            new_status = validate_staff_status(payload.status)
            if new_status in ("suspended", "invited") and staff.id == actor.id:
                raise HTTPException(status_code=400, detail="You cannot suspend your own account.")
            _guard_super_admin_target(db, staff, actor, "suspend or change")
            staff.status = new_status
    except ValueError as exc:
        raise _validation_error(exc) from exc

    super_role = get_super_admin_role(db)

    if payload.role_ids is not None:
        for row in db.exec(select(StaffRoleAssignment).where(StaffRoleAssignment.staff_id == staff_id)).all():
            db.delete(row)
        for role_id in payload.role_ids:
            if db.get(Role, role_id):
                db.add(StaffRoleAssignment(staff_id=staff_id, role_id=role_id))

    if payload.grant_super_admin is True and super_role:
        has = db.exec(
            select(StaffRoleAssignment).where(
                StaffRoleAssignment.staff_id == staff_id,
                StaffRoleAssignment.role_id == super_role.id,
            )
        ).first()
        if has is None:
            db.add(StaffRoleAssignment(staff_id=staff_id, role_id=super_role.id))
            staff.promoted_by_id = actor.id

    if payload.grant_super_admin is False and super_role:
        if staff.promoted_by_id == actor.id:
            raise HTTPException(
                status_code=400,
                detail="You cannot remove super admin from the account that granted it to you.",
            )
        for row in db.exec(
            select(StaffRoleAssignment).where(
                StaffRoleAssignment.staff_id == staff_id,
                StaffRoleAssignment.role_id == super_role.id,
            )
        ).all():
            db.delete(row)

    db.add(staff)
    db.commit()
    db.refresh(staff)
    return _serialize_staff(db, staff)


@router.post("/staff/{staff_id}/suspend", response_model=StaffPublic)
def suspend_staff(
    staff_id: str,
    db: Session = Depends(get_db),
    actor: StaffMember = Depends(require_super_admin),
):
    staff = db.get(StaffMember, staff_id)
    if staff is None:
        raise HTTPException(status_code=404, detail="Staff member not found.")
    if staff.id == actor.id:
        raise HTTPException(status_code=400, detail="You cannot suspend your own account.")
    _guard_super_admin_target(db, staff, actor, "suspend")
    staff.status = "suspended"
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return _serialize_staff(db, staff)


@router.post("/staff/{staff_id}/reactivate", response_model=StaffPublic)
def reactivate_staff(
    staff_id: str,
    db: Session = Depends(get_db),
    actor: StaffMember = Depends(require_super_admin),
):
    staff = db.get(StaffMember, staff_id)
    if staff is None:
        raise HTTPException(status_code=404, detail="Staff member not found.")
    staff.status = "active" if not staff.must_reset_password else "invited"
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return _serialize_staff(db, staff)


def _delete_staff_member(db: Session, staff_id: str, actor: StaffMember) -> None:
    staff = db.get(StaffMember, staff_id)
    if staff is None:
        raise HTTPException(status_code=404, detail="Staff member not found.")
    if staff.id == actor.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account.")
    _guard_super_admin_target(db, staff, actor, "delete")

    for row in db.exec(select(StaffRoleAssignment).where(StaffRoleAssignment.staff_id == staff_id)).all():
        db.delete(row)
    for row in db.exec(select(StaffInvite).where(StaffInvite.staff_id == staff_id)).all():
        db.delete(row)
    db.delete(staff)
    db.commit()


@router.post("/staff/{staff_id}/resend-invite")
def resend_invite(
    staff_id: str,
    db: Session = Depends(get_db),
    _: StaffMember = Depends(require_super_admin),
):
    staff = db.get(StaffMember, staff_id)
    if staff is None:
        raise HTTPException(status_code=404, detail="Staff member not found.")
    create_staff_invite(db, staff, "(use your previous temporary password)")
    return {"message": "Invite sent."}


@router.post("/staff/bulk-delete", response_model=BulkDeleteResult)
def bulk_delete_staff(
    payload: StaffBulkDelete,
    db: Session = Depends(get_db),
    actor: StaffMember = Depends(require_super_admin),
):
    deleted = 0
    for staff_id in payload.ids:
        try:
            _delete_staff_member(db, staff_id, actor)
            deleted += 1
        except HTTPException:
            continue
    return BulkDeleteResult(deleted=deleted)


@router.delete("/staff/{staff_id}", status_code=204)
def delete_staff(
    staff_id: str,
    db: Session = Depends(get_db),
    actor: StaffMember = Depends(require_super_admin),
):
    _delete_staff_member(db, staff_id, actor)
