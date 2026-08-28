"""add menu_items

Revision ID: b7e2f1a9c440
Revises: 2617535e95dc
Create Date: 2026-08-28 10:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b7e2f1a9c440"
down_revision: Union[str, Sequence[str], None] = "2617535e95dc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "menu_items",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("course", sa.String(length=80), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.String(length=600), nullable=False),
        sa.Column("tag", sa.String(length=20), nullable=False),
        sa.Column("price_pence", sa.Integer(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_menu_items_course"), "menu_items", ["course"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_menu_items_course"), table_name="menu_items")
    op.drop_table("menu_items")
