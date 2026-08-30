"""add staff password change codes

Revision ID: h8c901d012345
Revises: g7b8c901d01234
Create Date: 2026-08-30 23:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "h8c901d012345"
down_revision: Union[str, Sequence[str], None] = "g7b8c901d01234"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "staff_password_change_codes" in inspector.get_table_names():
        return

    op.create_table(
        "staff_password_change_codes",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("staff_id", sa.String(), nullable=False),
        sa.Column("code_hash", sa.String(), nullable=False),
        sa.Column("new_password_hash", sa.String(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("used_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["staff_id"], ["staff_members.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_staff_password_change_codes_staff_id"),
        "staff_password_change_codes",
        ["staff_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_staff_password_change_codes_staff_id"),
        table_name="staff_password_change_codes",
    )
    op.drop_table("staff_password_change_codes")
