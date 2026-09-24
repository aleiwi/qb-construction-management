from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event
from app.core.config import settings

# Engine configuration
# NOTE: pool_size / max_overflow are only valid for a queued pool (PostgreSQL).
# SQLite uses NullPool/Singleton and rejects those args, so gate them by dialect.
_is_sqlite = str(settings.DATABASE_URL).startswith("sqlite")
_engine_kwargs = {"echo": False, "future": True}
if _is_sqlite:
    engine = create_async_engine(settings.DATABASE_URL, **_engine_kwargs)
else:
    engine = create_async_engine(
        settings.DATABASE_URL,
        **_engine_kwargs,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=5,
        max_overflow=10,
    )


@event.listens_for(engine.sync_engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    """ج8: تفعيل WAL + مهلة قفل أطول حتى لا تحجب المعالجة الخلفية الطلبات الأخرى.
    Only applies to SQLite connections; PostgreSQL does not support PRAGMA."""
    if not str(settings.DATABASE_URL).startswith("sqlite"):
        return
    try:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=30000")
        cursor.close()
    except Exception:
        pass

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
