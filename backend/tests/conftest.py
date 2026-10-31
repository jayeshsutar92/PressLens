from collections.abc import AsyncGenerator
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import async_session_maker, engine
from app.main import app


@pytest_asyncio.fixture(scope="session", autouse=True)
async def cleanup_engine():
    """Ensure engine is cleanly disposed when the test session ends."""
    yield
    await engine.dispose()


@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Async HTTP client bound to the FastAPI application."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provides a transactional database session for tests."""
    async with async_session_maker() as session:
        yield session
