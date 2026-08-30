"""add food collection support on order items

Revision ID: d4e5f6a7b890
Revises: b7e2f1a9c440
Create Date: 2026-08-30 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d4e5f6a7b890"
down_revision: Union[str, Sequence[str], None] = "b7e2f1a9c440"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("order_items", sa.Column("menu_item_id", sa.String(), nullable=True))
    op.create_index(op.f("ix_order_items_menu_item_id"), "order_items", ["menu_item_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_order_items_menu_item_id"), table_name="order_items")
    op.drop_column("order_items", "menu_item_id")
