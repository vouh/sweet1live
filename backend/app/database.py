from collections.abc import Generator

from sqlmodel import Session, create_engine

from app.config import settings

# SQLite connect_args only apply to pytest throwaway DBs (ALLOW_SQLITE_TESTS=1).
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, connect_args=connect_args)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
