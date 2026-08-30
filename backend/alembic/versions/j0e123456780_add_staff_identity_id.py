"""add staff_members.identity_id

Revision ID: j0e123456780
Revises: i9d0123456789
Create Date: 2026-08-31 09:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "j0e123456780"
down_revision: Union[str, Sequence[str], None] = "i9d0123456789"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("staff_members")}

    if "identity_id" not in columns:
        op.add_column("staff_members", sa.Column("identity_id", sa.String(), nullable=True))

    existing_index_names = {ix["name"] for ix in inspector.get_indexes("staff_members")}
    if op.f("ix_staff_members_identity_id") not in existing_index_names:
        op.create_index(
            op.f("ix_staff_members_identity_id"),
            "staff_members",
            ["identity_id"],
            unique=False,
        )


def downgrade() -> None:
    op.drop_index(op.f("ix_staff_members_identity_id"), table_name="staff_members")
    op.drop_column("staff_members", "identity_id")
