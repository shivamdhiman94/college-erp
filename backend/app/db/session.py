from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

# Engine configuration with full compatibility for SQLite and Cloud PostgreSQL
engine_kwargs = {
    "echo": settings.DB_ECHO,
    "pool_pre_ping": True,
}

if settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Production PostgreSQL connection pooling parameters
    engine_kwargs["pool_size"] = settings.DB_POOL_SIZE
    engine_kwargs["max_overflow"] = settings.DB_MAX_OVERFLOW
    engine_kwargs["pool_timeout"] = settings.DB_POOL_TIMEOUT
    engine_kwargs["pool_recycle"] = settings.DB_POOL_RECYCLE

engine = create_engine(
    settings.DATABASE_URL,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency that provides a database session per request and handles cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
