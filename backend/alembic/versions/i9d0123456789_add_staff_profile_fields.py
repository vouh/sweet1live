"""add staff profile fields

Revision ID: i9d0123456789
Revises: h8c901d012345
Create Date: 2026-08-30 23:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "i9d0123456789"
down_revision: Union[str, Sequence[str], None] = "h8c901d012345"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("staff_members")}

    if "phone" not in columns:
        op.add_column("staff_members", sa.Column("phone", sa.String(length=32), nullable=False, server_default=""))
    if "location" not in columns:
        op.add_column("staff_members", sa.Column("location", sa.String(length=120), nullable=False, server_default=""))
    if "job_title" not in columns:
        op.add_column("staff_members", sa.Column("job_title", sa.String(length=80), nullable=False, server_default=""))
    if "notes" not in columns:
        op.add_column("staff_members", sa.Column("notes", sa.String(length=500), nullable=False, server_default=""))


def downgrade() -> None:
    op.drop_column("staff_members", "notes")
    op.drop_column("staff_members", "job_title")
    op.drop_column("staff_members", "location")
    op.drop_column("staff_members", "phone")
