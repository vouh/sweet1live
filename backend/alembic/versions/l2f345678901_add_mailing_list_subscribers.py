"""add mailing list subscribers

Revision ID: l2f345678901
Revises: k1f234567890
Create Date: 2026-08-31 15:30:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "l2f345678901"
down_revision: Union[str, Sequence[str], None] = "k1f234567890"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if "mailing_list_subscribers" in sa.inspect(bind).get_table_names():
        return
    op.create_table(
        "mailing_list_subscribers",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_mailing_list_subscribers_email"), "mailing_list_subscribers", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_mailing_list_subscribers_email"), table_name="mailing_list_subscribers")
    op.drop_table("mailing_list_subscribers")
