"""Test DATABASE_URL from repo root .env.local — run: python scripts/test_db_connection.py"""
from __future__ import annotations

import sys
from pathlib import Path

from sqlalchemy import create_engine, text

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.config import settings  # noqa: E402


def main() -> int:
    url = settings.database_url
    if not url.startswith("postgresql"):
        print("DATABASE_URL must be a PostgreSQL URL (Supabase).")
        return 1

    safe = url.split("@")[-1] if "@" in url else "(hidden)"
    print(f"Testing connection to …@{safe}")

    engine = create_engine(
        url,
        connect_args={"connect_timeout": 15},
        pool_pre_ping=True,
    )
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT current_database(), current_user, inet_server_addr()")
        ).fetchone()
    print("Connection OK")
    print(f"  database: {row[0]}")
    print(f"  user:     {row[1]}")
    print(f"  server:   {row[2]}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Connection FAILED: {type(exc).__name__}: {exc}")
        raise SystemExit(1) from exc
