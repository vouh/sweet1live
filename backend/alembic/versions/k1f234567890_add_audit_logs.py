"""add persistent audit logs

Revision ID: k1f234567890
Revises: j0e123456780
Create Date: 2026-08-31 12:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "k1f234567890"
down_revision: Union[str, Sequence[str], None] = "j0e123456780"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if "audit_logs" in sa.inspect(bind).get_table_names():
        return
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("actor_id", sa.String(), nullable=True),
        sa.Column("actor_email", sa.String(length=254), nullable=False),
        sa.Column("action", sa.String(length=80), nullable=False),
        sa.Column("target", sa.String(length=300), nullable=False),
        sa.Column("detail", sa.String(length=500), nullable=False),
        sa.Column("ip_address", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    for column in ("actor_id", "actor_email", "action", "created_at"):
        op.create_index(op.f(f"ix_audit_logs_{column}"), "audit_logs", [column], unique=False)


def downgrade() -> None:
    op.drop_table("audit_logs")
