import pytest
from app.agent.tools import (
    ContextValidationTool,
    KnowledgeRetrievalTool,
    ScenarioInspectionTool,
    TacticalRelationshipTool,
)


@pytest.mark.asyncio
async def test_context_validation_tool_missing_ball():
    """ContextValidationTool should flag missing ball coordinates and lower confidence."""
    tool = ContextValidationTool()
    scenario_no_ball = {
        "title": "No Ball Scenario",
        "match_phase": "high_press",
        "attacking_team": {"players": [{"id": f"a{i}", "position": {"x": 20, "y": 30}} for i in range(11)]},
        "defending_team": {"players": [{"id": f"d{i}", "position": {"x": 40, "y": 30}} for i in range(11)]},
    }
    result = await tool.execute(scenario_data=scenario_no_ball)
    assert result.success is True
    assert "ball_position" in result.data["missing_elements"]
    assert any("ball position" in lim.lower() for lim in result.data["limitations"])
    assert result.data["confidence_level"] in ("Low", "Medium")


@pytest.mark.asyncio
async def test_context_validation_tool_sparse_players():
    """ContextValidationTool should flag sparse player rosters."""
    tool = ContextValidationTool()
    sparse_scenario = {
        "title": "Sparse Scenario",
        "match_phase": "mid_block",
        "attacking_team": {"players": [{"id": "a1", "position": {"x": 10, "y": 30}}]},
        "defending_team": {"players": [{"id": "d1", "position": {"x": 50, "y": 30}}]},
        "ball_position": {"x": 10.0, "y": 30.0},
    }
    result = await tool.execute(scenario_data=sparse_scenario)
    assert result.success is True
    assert result.data["is_sufficient"] is False
    assert result.data["confidence_level"] == "Low"
    assert result.data["confidence_score"] <= 0.40


@pytest.mark.asyncio
async def test_tactical_relationship_tool_empty_players():
    """TacticalRelationshipTool should return success=False if teams have no players."""
    tool = TacticalRelationshipTool()
    empty_scenario = {
        "attacking_team": {"players": []},
        "defending_team": {"players": []},
        "ball_position": {"x": 50.0, "y": 34.0},
    }
    result = await tool.execute(scenario_data=empty_scenario)
    assert result.success is False
    assert "insufficient players" in result.summary.lower()


@pytest.mark.asyncio
async def test_tactical_relationship_tool_no_data():
    """TacticalRelationshipTool should fail gracefully when no scenario data is passed."""
    tool = TacticalRelationshipTool()
    result = await tool.execute()
    assert result.success is False
    assert "no scenario data" in result.summary.lower()


@pytest.mark.asyncio
async def test_scenario_inspection_tool_no_data():
    """ScenarioInspectionTool should fail gracefully when no scenario data is passed."""
    tool = ScenarioInspectionTool()
    result = await tool.execute()
    assert result.success is False
    assert "missing" in result.error_message.lower()


@pytest.mark.asyncio
async def test_knowledge_retrieval_tool_empty_query(db_session):
    """KnowledgeRetrievalTool should fail gracefully when search query is empty."""
    tool = KnowledgeRetrievalTool()
    result = await tool.execute(db=db_session, query="")
    assert result.success is False
    assert "empty" in result.error_message.lower()


@pytest.mark.asyncio
async def test_knowledge_retrieval_tool_missing_db():
    """KnowledgeRetrievalTool should fail gracefully when db session is missing."""
    tool = KnowledgeRetrievalTool()
    result = await tool.execute(query="pressing triggers")
    assert result.success is False
    assert "missing db" in result.error_message.lower()
