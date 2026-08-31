"""add event top flag

Revision ID: m3g456789012
Revises: l2f345678901
Create Date: 2026-08-31 16:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "m3g456789012"
down_revision: Union[str, Sequence[str], None] = "l2f345678901"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    columns = {column["name"] for column in sa.inspect(bind).get_columns("events")}
    if "is_top_event" not in columns:
        op.add_column(
            "events",
            sa.Column("is_top_event", sa.Boolean(), nullable=False, server_default=sa.false()),
        )
        op.create_index(op.f("ix_events_is_top_event"), "events", ["is_top_event"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_events_is_top_event"), table_name="events")
    op.drop_column("events", "is_top_event")
