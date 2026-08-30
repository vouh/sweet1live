"""Persistent security and administration audit events."""

from sqlmodel import Session

from app.models import AuditLog, StaffMember


def record_audit(
    db: Session,
    *,
    action: str,
    actor: StaffMember | None = None,
    actor_email: str = "",
    target: str = "",
    detail: str = "",
    ip_address: str = "",
) -> None:
    """Store metadata only. Callers must never pass tokens or passwords."""
    db.add(
        AuditLog(
            actor_id=actor.id if actor else None,
            actor_email=actor.email if actor else actor_email,
            action=action,
            target=target[:300],
            detail=detail[:500],
            ip_address=ip_address[:64],
        )
    )
    db.commit()
