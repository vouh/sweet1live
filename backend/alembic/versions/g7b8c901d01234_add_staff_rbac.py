"""add staff rbac tables

Revision ID: g7b8c901d01234
Revises: f6a7b8c901d012
Create Date: 2026-08-30 22:30:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "g7b8c901d01234"
down_revision: Union[str, Sequence[str], None] = "f6a7b8c901d012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "permissions" not in tables:
        op.create_table(
            "permissions",
            sa.Column("id", sa.String(length=80), nullable=False),
            sa.Column("category", sa.String(length=80), nullable=False),
            sa.Column("label", sa.String(length=120), nullable=False),
            sa.Column("sort_order", sa.Integer(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )

    if "roles" not in tables:
        op.create_table(
            "roles",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("name", sa.String(length=80), nullable=False),
            sa.Column("is_super_admin", sa.Boolean(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_roles_name"), "roles", ["name"], unique=True)

    if "role_permissions" not in tables:
        op.create_table(
            "role_permissions",
            sa.Column("role_id", sa.String(), nullable=False),
            sa.Column("permission_id", sa.String(length=80), nullable=False),
            sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"]),
            sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
            sa.PrimaryKeyConstraint("role_id", "permission_id"),
        )

    if "staff_members" not in tables:
        op.create_table(
            "staff_members",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("email", sa.String(), nullable=False),
            sa.Column("name", sa.String(length=200), nullable=False),
            sa.Column("password_hash", sa.String(), nullable=False),
            sa.Column("status", sa.String(), nullable=False),
            sa.Column("must_reset_password", sa.Boolean(), nullable=False),
            sa.Column("invited_by_id", sa.String(), nullable=True),
            sa.Column("promoted_by_id", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["invited_by_id"], ["staff_members.id"]),
            sa.ForeignKeyConstraint(["promoted_by_id"], ["staff_members.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_staff_members_email"), "staff_members", ["email"], unique=True)
        op.create_index(op.f("ix_staff_members_status"), "staff_members", ["status"], unique=False)

    if "staff_role_assignments" not in tables:
        op.create_table(
            "staff_role_assignments",
            sa.Column("staff_id", sa.String(), nullable=False),
            sa.Column("role_id", sa.String(), nullable=False),
            sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
            sa.ForeignKeyConstraint(["staff_id"], ["staff_members.id"]),
            sa.PrimaryKeyConstraint("staff_id", "role_id"),
        )

    if "staff_invites" not in tables:
        op.create_table(
            "staff_invites",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("staff_id", sa.String(), nullable=False),
            sa.Column("token_hash", sa.String(), nullable=False),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
            sa.Column("used_at", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["staff_id"], ["staff_members.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_staff_invites_staff_id"), "staff_invites", ["staff_id"], unique=False)
        op.create_index(op.f("ix_staff_invites_token_hash"), "staff_invites", ["token_hash"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_staff_invites_token_hash"), table_name="staff_invites")
    op.drop_index(op.f("ix_staff_invites_staff_id"), table_name="staff_invites")
    op.drop_table("staff_invites")
    op.drop_table("staff_role_assignments")
    op.drop_index(op.f("ix_staff_members_status"), table_name="staff_members")
    op.drop_index(op.f("ix_staff_members_email"), table_name="staff_members")
    op.drop_table("staff_members")
    op.drop_table("role_permissions")
    op.drop_index(op.f("ix_roles_name"), table_name="roles")
    op.drop_table("roles")
    op.drop_table("permissions")
