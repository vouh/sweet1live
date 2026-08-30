"""add menu categories and dish media fields

Revision ID: e5f6a7b8c901
Revises: d4e5f6a7b890
Create Date: 2026-08-30 12:00:00.000000
"""

import uuid
from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e5f6a7b8c901"
down_revision: Union[str, Sequence[str], None] = "d4e5f6a7b890"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "menu_items", sa.Column("images", sa.JSON(), nullable=False, server_default="[]")
    )
    op.add_column(
        "menu_items",
        sa.Column("ingredients", sa.String(length=1000), nullable=False, server_default=""),
    )
    op.add_column(
        "menu_items",
        sa.Column("nutrition", sa.String(length=500), nullable=False, server_default=""),
    )

    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # A dev server running SQLModel.metadata.create_all() on startup can have
    # already created this table (empty, no data) the moment the model was
    # added — create_all() only fills in missing tables, it never alters
    # existing ones, so the menu_items columns above still needed this
    # migration. Guard each step so re-running (or running after that) is safe.
    if "menu_categories" not in inspector.get_table_names():
        op.create_table(
            "menu_categories",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("name", sa.String(length=80), nullable=False),
            sa.Column("sort_order", sa.Integer(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        inspector = sa.inspect(bind)

    existing_index_names = {ix["name"] for ix in inspector.get_indexes("menu_categories")}
    if op.f("ix_menu_categories_name") not in existing_index_names:
        op.create_index(op.f("ix_menu_categories_name"), "menu_categories", ["name"], unique=True)

    # Backfill from whatever course names already exist (skipping any name
    # already present) so upgrading a database with dishes on it doesn't
    # start the settings modal empty.
    menu_categories = sa.table(
        "menu_categories",
        sa.column("id", sa.String),
        sa.column("name", sa.String),
        sa.column("sort_order", sa.Integer),
        sa.column("created_at", sa.DateTime),
    )
    already_named = {
        row[0] for row in bind.execute(sa.text("SELECT name FROM menu_categories")).fetchall()
    }
    new_names = [
        row[0]
        for row in bind.execute(
            sa.text("SELECT DISTINCT course FROM menu_items ORDER BY course")
        ).fetchall()
        if row[0] not in already_named
    ]
    top = bind.execute(sa.text("SELECT COALESCE(MAX(sort_order), -1) FROM menu_categories")).scalar()
    now = datetime.utcnow()
    for i, name in enumerate(new_names):
        bind.execute(
            menu_categories.insert().values(
                id=uuid.uuid4().hex, name=name, sort_order=top + 1 + i, created_at=now
            )
        )


def downgrade() -> None:
    op.drop_index(op.f("ix_menu_categories_name"), table_name="menu_categories")
    op.drop_table("menu_categories")
    op.drop_column("menu_items", "nutrition")
    op.drop_column("menu_items", "ingredients")
    op.drop_column("menu_items", "images")
