import uuid
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.analysis import Analysis
from app.models.knowledge_chunk import KnowledgeChunk
from app.models.knowledge_document import KnowledgeDocument
from app.models.scenario import Scenario
from app.schemas.knowledge import KnowledgeDocumentCreate, SourceMetadata
from app.schemas.scenario import (
    BallPosition,
    Player,
    PlayerPosition,
    ScenarioCreate,
    TeamTacticalSetup,
)
from app.services.analysis_service import AnalysisService
from app.services.knowledge_service import KnowledgeService
from app.services.scenario_service import ScenarioService


@pytest.mark.asyncio
async def test_scenario_cascade_deletes_analyses(db_session: AsyncSession):
    """Deleting a scenario should cascade-delete all its dependent analysis records."""
    # 1. Create a custom scenario
    scenario_in = ScenarioCreate(
        title=f"Cascade Test Scenario {uuid.uuid4().hex[:6]}",
        match_phase="high_press",
        tactical_situation="Testing cascade deletion",
        attacking_team=TeamTacticalSetup(
            name="Attacking Team",
            formation="4-3-3",
            players=[
                Player(
                    id="att_1",
                    number=1,
                    name="GK",
                    role="GK",
                    position=PlayerPosition(x=10.0, y=34.0),
                ),
                Player(
                    id="att_2",
                    number=4,
                    name="CB",
                    role="CB",
                    position=PlayerPosition(x=25.0, y=34.0),
                ),
            ],
        ),
        defending_team=TeamTacticalSetup(
            name="Defending Team",
            formation="4-3-3",
            players=[
                Player(
                    id="def_1",
                    number=9,
                    name="Presser",
                    role="CF",
                    position=PlayerPosition(x=30.0, y=34.0),
                ),
            ],
        ),
        ball_position=BallPosition(x=25.0, y=34.0),
    )
    scenario = await ScenarioService.create_scenario(db=db_session, scenario_in=scenario_in)
    scenario_id = scenario.id

    # 2. Directly create an Analysis row bound to this scenario
    analysis_id = uuid.uuid4()
    analysis = Analysis(
        id=analysis_id,
        scenario_id=scenario_id,
        tactical_summary="Cascade test summary",
        status="completed",
    )
    db_session.add(analysis)
    await db_session.flush()

    # Verify analysis is in database
    chk = await db_session.execute(select(Analysis).where(Analysis.id == analysis_id))
    assert chk.scalar_one_or_none() is not None

    # 3. Delete the scenario
    await ScenarioService.delete_scenario(db=db_session, scenario_id=scenario_id)
    await db_session.commit()

    # 4. Verify both scenario and analysis are gone
    scenario_chk = await db_session.execute(select(Scenario).where(Scenario.id == scenario_id))
    assert scenario_chk.scalar_one_or_none() is None

    analysis_chk = await db_session.execute(select(Analysis).where(Analysis.id == analysis_id))
    assert analysis_chk.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_knowledge_document_cascade_deletes_chunks(db_session: AsyncSession):
    """Deleting a knowledge document should cascade-delete all its atomic vector chunks."""
    # 1. Create a knowledge document
    doc_in = KnowledgeDocumentCreate(
        title=f"Cascade Test Theory {uuid.uuid4().hex[:6]}",
        topic="counter_pressing",
        category="tactical_theory",
        summary="Testing vector chunk cascade deletion",
        content="Gegenpressing requires immediate pressure within 5 seconds of turnover. The nearest defenders must close down passing avenues.",
        tactical_principles=["Immediate counter-pressure", "Compact rest defense"],
        source_metadata=SourceMetadata(author="Tactical Analyst"),
        tags=["counter_press", "cascade"],
    )
    doc = await KnowledgeService.create_knowledge_document(db=db_session, doc_in=doc_in)
    doc_id = doc.id
    await db_session.commit()

    # 2. Verify chunks were created
    chunks_stmt = select(KnowledgeChunk).where(KnowledgeChunk.document_id == doc_id)
    chunks_res = await db_session.execute(chunks_stmt)
    chunks = list(chunks_res.scalars().all())
    assert len(chunks) > 0

    # 3. Delete the document
    await db_session.delete(doc)
    await db_session.commit()

    # 4. Verify document and chunks are gone
    doc_chk = await db_session.execute(select(KnowledgeDocument).where(KnowledgeDocument.id == doc_id))
    assert doc_chk.scalar_one_or_none() is None

    chunks_chk = await db_session.execute(select(KnowledgeChunk).where(KnowledgeChunk.document_id == doc_id))
    assert len(list(chunks_chk.scalars().all())) == 0

