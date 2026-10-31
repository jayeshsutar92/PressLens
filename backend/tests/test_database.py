import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import check_db_connection


@pytest.mark.asyncio
async def test_database_connection():
    """Verify that the PostgreSQL connection helper executes cleanly."""
    is_connected = await check_db_connection()
    assert is_connected is True


@pytest.mark.asyncio
async def test_tables_created(db_session: AsyncSession):
    """Verify that all entity tables and alembic table exist in public schema with UUID primary keys."""
    result = await db_session.execute(
        text(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'public' ORDER BY table_name;"
        )
    )
    existing_tables = [row[0] for row in result.fetchall()]

    assert "alembic_version" in existing_tables
    assert "scenarios" in existing_tables
    assert "analyses" in existing_tables
    assert "knowledge_documents" in existing_tables
    assert "conversation_messages" in existing_tables

    # Verify UUID primary key data type for scenarios
    col_result = await db_session.execute(
        text(
            "SELECT data_type FROM information_schema.columns "
            "WHERE table_name = 'scenarios' AND column_name = 'id';"
        )
    )
    data_type = col_result.scalar()
    assert data_type == "uuid"
