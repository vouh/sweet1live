"""add event type and physical location

Revision ID: n4h567890123
Revises: m3g456789012
Create Date: 2026-09-08 12:00:00.000000
"""

from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "n4h567890123"
down_revision: Union[str, Sequence[str], None] = "m3g456789012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("events")}
    if "event_type" not in columns:
        op.add_column("events", sa.Column("event_type", sa.String(), nullable=False, server_default="in_house"))
        op.create_index(op.f("ix_events_event_type"), "events", ["event_type"], unique=False)
    if "venue_name" not in columns:
        op.add_column("events", sa.Column("venue_name", sa.String(), nullable=False, server_default=""))
    if "venue_address" not in columns:
        op.add_column("events", sa.Column("venue_address", sa.String(), nullable=False, server_default=""))


def downgrade() -> None:
    op.drop_column("events", "venue_address")
    op.drop_column("events", "venue_name")
    op.drop_index(op.f("ix_events_event_type"), table_name="events")
    op.drop_column("events", "event_type")
