import pytest
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import check_db_connection
from app.models.analysis import Analysis
from app.models.conversation_message import ConversationMessage
from app.models.knowledge_document import KnowledgeDocument
from app.models.scenario import Scenario


@pytest.mark.asyncio
async def test_database_connection():
    """Verify that the PostgreSQL connection helper executes cleanly."""
    is_connected = await check_db_connection()
    assert is_connected is True


@pytest.mark.asyncio
async def test_tables_created(db_session: AsyncSession):
    """Verify that all four initial entity tables and alembic table exist in public schema."""
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


@pytest.mark.asyncio
async def test_scenario_and_analysis_relationship(db_session: AsyncSession):
    """Verify model creation and relationship cascade in the database."""
    test_scenario = Scenario(
        title="4-3-3 High Press Trap vs Build-up",
        description="Testing high pressing trap on right central defender",
        match_context={"formation": "4-3-3", "minute": 24, "zone": "Zone 14"},
        status="active",
    )
    db_session.add(test_scenario)
    await db_session.flush()

    assert test_scenario.id is not None
    assert test_scenario.created_at is not None

    test_analysis = Analysis(
        scenario_id=test_scenario.id,
        tactical_summary="Effective overload forcing a misplaced pass towards the touchline.",
        pressing_intensity="high",
        metrics={"ppda": 6.8, "line_height_m": 52.4},
        status="completed",
    )
    db_session.add(test_analysis)
    await db_session.flush()

    assert test_analysis.id is not None
    assert test_analysis.scenario_id == test_scenario.id

    # Retrieve via query
    query = select(Scenario).where(Scenario.id == test_scenario.id)
    retrieved = (await db_session.execute(query)).scalar_one()
    assert retrieved.title == "4-3-3 High Press Trap vs Build-up"
    assert len(retrieved.analyses) == 1
    assert retrieved.analyses[0].pressing_intensity == "high"

    # Clean up test rows
    await db_session.delete(test_scenario)
    await db_session.commit()
