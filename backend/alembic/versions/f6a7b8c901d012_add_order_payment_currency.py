"""add order foreign payment audit columns

Revision ID: f6a7b8c901d012
Revises: e5f6a7b8c901
Create Date: 2026-08-30 22:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f6a7b8c901d012"
down_revision: Union[str, Sequence[str], None] = "e5f6a7b8c901"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("orders")}

    if "charged_currency" not in columns:
        op.add_column("orders", sa.Column("charged_currency", sa.String(), nullable=True))
    if "charged_amount_pence" not in columns:
        op.add_column("orders", sa.Column("charged_amount_pence", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("orders", "charged_amount_pence")
    op.drop_column("orders", "charged_currency")
