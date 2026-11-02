from collections.abc import AsyncGenerator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from app.core.config import settings
from app.core.logging import logger

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=(settings.APP_ENV == "development" and False),
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides an asynchronous database session."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error("Database session rolled back due to error: %s", str(e))
            raise
        finally:
            await session.close()


async def check_db_connection() -> bool:
    """Verifies that the PostgreSQL database connection is operational."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.error("Database connectivity check failed: %s", str(exc))
        return False


async def check_schema_readiness() -> bool:
    """Verifies that the required application tables exist."""
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT to_regclass('public.scenarios')"))
            table_ref = result.scalar()
            return table_ref is not None
    except Exception as exc:
        logger.error("Schema readiness verification failed: %s", str(exc))
        return False


