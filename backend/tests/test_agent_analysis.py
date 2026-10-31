import uuid
from unittest.mock import AsyncMock, patch
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.agent.orchestrator import TacticalAgentOrchestrator
from app.agent.tools.knowledge_tool import KnowledgeRetrievalTool
from app.agent.tools.relationship_tool import TacticalRelationshipTool
from app.agent.tools.scenario_tool import ScenarioInspectionTool
from app.agent.tools.validation_tool import ContextValidationTool
from app.integrations.groq_client import GroqClient
from app.schemas.analysis import (
    ConfidenceAndLimitations,
    ExposedSpaces,
    FanWatchPoints,
    FullTacticalAnalysisReport,
    OppositionResponses,
    PassingLaneCoverage,
    PressingStrategy,
    PressingTriggers,
    SituationOverview,
    TacticalAdvantages,
)
from app.schemas.rag import SourceCitation


# ---------------------------------------------------------------------------
# Sample Scenarios for Testing & Tactical Scenarios Evaluation
# ---------------------------------------------------------------------------

SAMPLE_HIGH_PRESS_SCENARIO = {
    "title": "Liverpool 4-3-3 High Press Trap vs Brighton",
    "match_phase": "high_press",
    "tactical_situation": "Opposition build-up from deep defensive third",
    "attacking_team": {
        "name": "Brighton",
        "formation": "4-2-3-1",
        "players": [
            {"id": "b1", "number": 1, "name": "Verbruggen", "role": "GK", "position": {"x": 6.0, "y": 34.0}},
            {"id": "b2", "number": 29, "name": "Van Hecke", "role": "CB", "position": {"x": 16.5, "y": 48.0}},
            {"id": "b3", "number": 5, "name": "Dunk", "role": "CB", "position": {"x": 16.5, "y": 20.0}},
            {"id": "b4", "number": 34, "name": "Veltman", "role": "RB", "position": {"x": 28.0, "y": 62.0}},
            {"id": "b5", "number": 30, "name": "Estupiñán", "role": "LB", "position": {"x": 28.0, "y": 6.0}},
            {"id": "b6", "number": 13, "name": "Groß", "role": "DM", "position": {"x": 26.0, "y": 38.0}},
            {"id": "b7", "number": 20, "name": "Baleba", "role": "DM", "position": {"x": 25.0, "y": 26.0}},
            {"id": "b8", "number": 11, "name": "Adingra", "role": "RW", "position": {"x": 55.0, "y": 60.0}},
            {"id": "b9", "number": 22, "name": "Mitoma", "role": "LW", "position": {"x": 55.0, "y": 8.0}},
            {"id": "b10", "number": 10, "name": "Enciso", "role": "AM", "position": {"x": 46.0, "y": 34.0}},
            {"id": "b11", "number": 18, "name": "Welbeck", "role": "CF", "position": {"x": 68.0, "y": 34.0}},
        ],
    },
    "defending_team": {
        "name": "Liverpool",
        "formation": "4-3-3",
        "players": [
            {"id": "l1", "number": 1, "name": "Alisson", "role": "GK", "position": {"x": 92.0, "y": 34.0}},
            {"id": "l2", "number": 4, "name": "Van Dijk", "role": "CB", "position": {"x": 65.0, "y": 38.0}},
            {"id": "l3", "number": 5, "name": "Konaté", "role": "CB", "position": {"x": 65.0, "y": 26.0}},
            {"id": "l4", "number": 66, "name": "Alexander-Arnold", "role": "RB", "position": {"x": 60.0, "y": 8.0}},
            {"id": "l5", "number": 26, "name": "Robertson", "role": "LB", "position": {"x": 58.0, "y": 60.0}},
            {"id": "l6", "number": 10, "name": "Mac Allister", "role": "DM", "position": {"x": 42.0, "y": 34.0}},
            {"id": "l7", "number": 8, "name": "Szoboszlai", "role": "CM", "position": {"x": 30.0, "y": 42.0}},
            {"id": "l8", "number": 17, "name": "Jones", "role": "CM", "position": {"x": 32.0, "y": 24.0}},
            {"id": "l9", "number": 11, "name": "Salah", "role": "RW", "position": {"x": 22.0, "y": 18.0}},
            {"id": "l10", "number": 7, "name": "Díaz", "role": "LW", "position": {"x": 24.0, "y": 55.0}},
            {"id": "l11", "number": 9, "name": "Núñez", "role": "CF", "position": {"x": 19.0, "y": 32.0}},
        ],
    },
    "ball_position": {"x": 17.5, "y": 47.0, "zone": "Defensive Third - Right Half-space"},
}

SAMPLE_COUNTER_PRESS_SCENARIO = {
    "title": "Manchester City Immediate Gegenpress in Zone 14",
    "match_phase": "counter_press",
    "tactical_situation": "Turnover in central Zone 14 with rapid 5-second counter-press",
    "attacking_team": {
        "name": "Opponent Transition",
        "formation": "4-4-2",
        "players": [
            {"id": "o1", "number": 1, "name": "GK", "role": "GK", "position": {"x": 5.0, "y": 34.0}},
            {"id": "o2", "number": 4, "name": "Ball Carrier", "role": "CM", "position": {"x": 68.0, "y": 34.0}},
            {"id": "o3", "number": 7, "name": "Outlet Wing", "role": "RM", "position": {"x": 75.0, "y": 58.0}},
            {"id": "o4", "number": 9, "name": "Striker", "role": "CF", "position": {"x": 88.0, "y": 32.0}},
            {"id": "o5", "number": 6, "name": "Defender", "role": "CB", "position": {"x": 35.0, "y": 30.0}},
            {"id": "o6", "number": 8, "name": "Midfielder", "role": "CM", "position": {"x": 55.0, "y": 20.0}},
        ],
    },
    "defending_team": {
        "name": "Manchester City",
        "formation": "3-2-4-1",
        "players": [
            {"id": "m1", "number": 31, "name": "Ederson", "role": "GK", "position": {"x": 95.0, "y": 34.0}},
            {"id": "m2", "number": 16, "name": "Rodri", "role": "DM", "position": {"x": 65.0, "y": 33.0}},
            {"id": "m3", "number": 17, "name": "De Bruyne", "role": "AM", "position": {"x": 70.0, "y": 36.0}},
            {"id": "m4", "number": 20, "name": "Bernardo", "role": "AM", "position": {"x": 69.0, "y": 42.0}},
            {"id": "m5", "number": 9, "name": "Haaland", "role": "CF", "position": {"x": 73.0, "y": 30.0}},
            {"id": "m6", "number": 25, "name": "Akanji", "role": "CB", "position": {"x": 50.0, "y": 34.0}},
        ],
    },
    "ball_position": {"x": 68.0, "y": 34.0, "zone": "Zone 14 - Attacking Midfield"},
}

INCOMPLETE_SPARSE_SCENARIO = {
    "title": "Sparse Incomplete Scenario",
    "match_phase": "unknown",
    "tactical_situation": "Unclear situation with missing players",
    "attacking_team": {
        "name": "Team A",
        "formation": "Unknown",
        "players": [
            {"id": "a1", "number": 10, "name": "Player 1", "role": "MF", "position": {"x": 50.0, "y": 30.0}},
            {"id": "a2", "number": 11, "name": "Player 2", "role": "FW", "position": {"x": None, "y": None}},
        ],
    },
    "defending_team": {
        "name": "Team B",
        "formation": "Unknown",
        "players": [
            {"id": "b1", "number": 4, "name": "Defender 1", "role": "DF", "position": {"x": 55.0, "y": 32.0}},
        ],
    },
    "ball_position": {"x": None, "y": None, "zone": "Unknown"},
}


# ---------------------------------------------------------------------------
# Unit Tests for Agent Tools
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_scenario_inspection_tool():
    """Verify ScenarioInspectionTool extracts structured teams, key roles, and summary."""
    tool = ScenarioInspectionTool()
    result = await tool.execute(scenario_data=SAMPLE_HIGH_PRESS_SCENARIO)

    assert result.success is True
    assert result.tool_name == "scenario_inspection"
    data = result.data
    assert data["title"] == "Liverpool 4-3-3 High Press Trap vs Brighton"
    assert data["attacking_team"]["player_count"] == 11
    assert data["defending_team"]["player_count"] == 11
    assert "CB" in data["attacking_team"]["key_roles"]
    assert "CF" in data["defending_team"]["key_roles"]
    assert data["ball_position"]["x"] == 17.5


@pytest.mark.asyncio
async def test_tactical_relationship_tool():
    """Verify TacticalRelationshipTool computes deterministic spatial metrics, distances, and cover shadows."""
    tool = TacticalRelationshipTool()
    result = await tool.execute(scenario_data=SAMPLE_HIGH_PRESS_SCENARIO)

    assert result.success is True
    assert result.tool_name == "tactical_relationship_analysis"
    data = result.data

    # Ball carrier should be Van Hecke (nearest to ball at 17.5, 47.0)
    assert data["ball_carrier"]["name"] == "Van Hecke"
    assert data["ball_carrier"]["distance_to_ball"] < 2.0

    # Primary presser
    assert data["primary_presser"] is not None
    assert "name" in data["primary_presser"]
    assert data["primary_presser"]["distance_to_ball"] > 0

    # Compactness
    comp = data["compactness"]
    assert comp["vertical_block_length_meters"] > 0
    assert comp["horizontal_block_width_meters"] > 0

    # Passing lanes and cover shadows
    assert "passing_lanes" in data
    assert len(data["passing_lanes"]) > 0
    summary = data["passing_lane_summary"]
    assert "total_outlets" in summary
    assert "blocked_by_cover_shadow" in summary


@pytest.mark.asyncio
async def test_context_validation_tool_sufficient():
    """Verify ContextValidationTool classifies complete scenario as high confidence."""
    tool = ContextValidationTool()
    result = await tool.execute(scenario_data=SAMPLE_HIGH_PRESS_SCENARIO)

    assert result.success is True
    assert result.data["is_sufficient"] is True
    assert result.data["confidence_level"] == "High"
    assert result.data["confidence_score"] >= 0.90
    assert len(result.data["missing_elements"]) == 0


@pytest.mark.asyncio
async def test_context_validation_tool_incomplete_communicates_uncertainty():
    """Verify ContextValidationTool flags sparse scenarios as low confidence with explicit limitations."""
    tool = ContextValidationTool()
    result = await tool.execute(scenario_data=INCOMPLETE_SPARSE_SCENARIO)

    assert result.success is True
    assert result.data["is_sufficient"] is False
    assert result.data["confidence_level"] == "Low"
    assert result.data["confidence_score"] <= 0.50
    assert "ball_position" in result.data["missing_elements"]
    assert len(result.data["limitations"]) > 0


@pytest.mark.asyncio
async def test_knowledge_retrieval_tool(db_session: AsyncSession):
    """Verify KnowledgeRetrievalTool retrieves tactical concepts and citations from PostgreSQL."""
    tool = KnowledgeRetrievalTool()
    result = await tool.execute(
        db=db_session,
        query="pressing traps and cover shadows in high block",
        top_k=3,
    )

    assert result.success is True
    assert result.tool_name == "tactical_knowledge_retrieval"
    assert result.data["count"] >= 1
    assert len(result.data["citations"]) >= 1


# ---------------------------------------------------------------------------
# Agent Orchestrator & Tactical Evaluation Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_agent_orchestrator_deterministic_fallback(db_session: AsyncSession):
    """Verify TacticalAgentOrchestrator generates complete 10-section report when LLM is unavailable."""
    orchestrator = TacticalAgentOrchestrator()
    report, spatial_info, tools_executed = await orchestrator.run_analysis(
        db=db_session,
        scenario_data=SAMPLE_HIGH_PRESS_SCENARIO,
        user_query="How is Liverpool directing the press?",
    )

    # Verify executed tools
    assert "context_validation" in tools_executed
    assert "scenario_inspection" in tools_executed
    assert "tactical_relationship_analysis" in tools_executed
    assert "tactical_knowledge_retrieval" in tools_executed

    # Verify all 10 structured sections
    assert isinstance(report, FullTacticalAnalysisReport)
    assert report.situation_overview.match_phase == "high_press"
    assert len(report.situation_overview.summary) > 20
    assert report.pressing_strategy.intensity is not None
    assert len(report.pressing_triggers.visual_triggers) > 0
    assert len(report.tactical_advantages.key_advantages) > 0
    assert len(report.exposed_spaces.exposed_zones) > 0
    assert len(report.opposition_responses.recommended_counters) > 0
    assert len(report.fan_watch_points.what_to_watch_next) > 0
    assert report.confidence_and_limitations.confidence_score > 0
    assert len(report.supporting_sources) > 0


@pytest.mark.asyncio
async def test_agent_orchestrator_mocked_llm(db_session: AsyncSession):
    """Verify TacticalAgentOrchestrator parses and grounds structured LLM output from Groq."""
    mock_report = FullTacticalAnalysisReport(
        situation_overview=SituationOverview(
            match_phase="high_press",
            tactical_situation="Build-up obstruction",
            attacking_team_setup="4-2-3-1",
            defending_team_setup="4-3-3",
            ball_location_summary="Defensive right half-space",
            summary="Liverpool initiates an angled press forcing play wide.",
        ),
        pressing_strategy=PressingStrategy(
            intensity="High Press",
            primary_objective="Force turnover on touchline",
            pressing_direction="Touchline lock",
            coordination_scheme="Winger curls run while central midfielder shadows pivot.",
        ),
        pressing_triggers=PressingTriggers(
            visual_triggers=["Back-pass to right CB"],
            tactical_traps=["Sideline trap"],
            primary_trigger_player="#9 Núñez",
        ),
        passing_lane_coverage=PassingLaneCoverage(
            cover_shadows_active=["Central pivot Groß shadowed"],
            blocked_options=["Vertical pass into Zone 14"],
            contested_options=["Square pass to Dunk"],
            open_escape_routes=["Back to GK"],
        ),
        tactical_advantages=TacticalAdvantages(
            compactness_advantage="Horizontal width locked to 28m",
            turnover_potential="High near sideline",
            key_advantages=["Forces rushed clearance"],
        ),
        exposed_spaces=ExposedSpaces(
            exposed_zones=["Weak-side flank"],
            rest_defense_risk="High line exposed to switches",
            key_vulnerabilities=["Long diagonal switch"],
        ),
        opposition_responses=OppositionResponses(
            recommended_counters=["Third-man wall pass"],
            switch_potential="Difficult under pressure",
            third_man_runs="Midfielder dropping deep",
        ),
        fan_watch_points=FanWatchPoints(
            what_to_watch_next="Watch whether Van Hecke can find Groß or kicks long.",
            key_duel_to_follow="Núñez vs Van Hecke",
            tactical_takeaway="The sideline acts as a 12th defender.",
        ),
        confidence_and_limitations=ConfidenceAndLimitations(
            confidence_score=0.92,
            confidence_level="High",
            data_sufficiency="Sufficient",
            limitations=[],
        ),
        supporting_sources=[],
    )

    with patch.object(GroqClient, "chat_completion_structured", new=AsyncMock(return_value=mock_report)):
        orchestrator = TacticalAgentOrchestrator()
        report, spatial_info, tools_executed = await orchestrator.run_analysis(
            db=db_session,
            scenario_data=SAMPLE_HIGH_PRESS_SCENARIO,
            user_query="Evaluate cover shadows",
        )

        assert report.situation_overview.summary == "Liverpool initiates an angled press forcing play wide."
        assert report.fan_watch_points.key_duel_to_follow == "Núñez vs Van Hecke"
        assert len(report.supporting_sources) > 0  # Attached from RAG retrieval


@pytest.mark.asyncio
async def test_agent_orchestrator_handles_incomplete_scenario_with_uncertainty(db_session: AsyncSession):
    """Verify orchestrator explicitly communicates low confidence and data limitations for sparse scenarios."""
    orchestrator = TacticalAgentOrchestrator()
    report, _, _ = await orchestrator.run_analysis(
        db=db_session,
        scenario_data=INCOMPLETE_SPARSE_SCENARIO,
    )

    assert report.confidence_and_limitations.confidence_level == "Low"
    assert report.confidence_and_limitations.confidence_score <= 0.50
    assert len(report.confidence_and_limitations.limitations) > 0


@pytest.mark.asyncio
async def test_predefined_scenarios_produce_distinct_tactics(db_session: AsyncSession):
    """Evaluate agent across distinct predefined scenarios (High Press vs Gegenpress)."""
    orchestrator = TacticalAgentOrchestrator()

    report_hp, spatial_hp, _ = await orchestrator.run_analysis(
        db=db_session,
        scenario_data=SAMPLE_HIGH_PRESS_SCENARIO,
    )
    report_cp, spatial_cp, _ = await orchestrator.run_analysis(
        db=db_session,
        scenario_data=SAMPLE_COUNTER_PRESS_SCENARIO,
    )

    # Scenarios must yield distinct phases, directions, and summaries
    assert report_hp.situation_overview.match_phase == "high_press"
    assert report_cp.situation_overview.match_phase == "counter_press"
    assert spatial_hp["ball_carrier"]["name"] != spatial_cp["ball_carrier"]["name"]
    assert "counter" in report_cp.situation_overview.summary.lower() or "transition" in report_cp.situation_overview.summary.lower()


# ---------------------------------------------------------------------------
# API Endpoints & Persistence Integration Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_and_retrieve_analysis_api(async_client: AsyncClient):
    """Verify POST /api/v1/analysis initiates analysis, persists it, and GET /api/v1/analysis/{id} retrieves it."""
    # 1. Fetch available scenario
    scenarios_res = await async_client.get("/api/v1/scenarios")
    assert scenarios_res.status_code == 200
    scenario_id = scenarios_res.json()[0]["id"]

    # 2. Initiate Analysis
    payload = {
        "scenario_id": scenario_id,
        "user_query": "Explain how the pressing triggers are baited in this setup.",
    }
    create_res = await async_client.post("/api/v1/analysis", json=payload)
    assert create_res.status_code == 201

    analysis_data = create_res.json()
    assert "id" in analysis_data
    analysis_id = analysis_data["id"]
    assert analysis_data["status"] == "completed"
    assert analysis_data["scenario_id"] == scenario_id
    assert "analysis" in analysis_data
    assert "situation_overview" in analysis_data["analysis"]
    assert "fan_watch_points" in analysis_data["analysis"]
    assert len(analysis_data["tools_executed"]) >= 3

    # 3. Retrieve Analysis with Conversation History
    get_res = await async_client.get(f"/api/v1/analysis/{analysis_id}")
    assert get_res.status_code == 200
    detail_data = get_res.json()
    assert detail_data["id"] == analysis_id
    assert "messages" in detail_data
    assert len(detail_data["messages"]) >= 2  # Initial user query and assistant overview


@pytest.mark.asyncio
async def test_analysis_status_endpoint(async_client: AsyncClient):
    """Verify GET /api/v1/analysis/{id}/status returns lightweight status."""
    scenarios_res = await async_client.get("/api/v1/scenarios")
    scenario_id = scenarios_res.json()[0]["id"]

    create_res = await async_client.post("/api/v1/analysis", json={"scenario_id": scenario_id})
    analysis_id = create_res.json()["id"]

    status_res = await async_client.get(f"/api/v1/analysis/{analysis_id}/status")
    assert status_res.status_code == 200
    data = status_res.json()
    assert data["id"] == analysis_id
    assert data["status"] == "completed"
    assert data["scenario_id"] == scenario_id


@pytest.mark.asyncio
async def test_follow_up_conversation_endpoint(async_client: AsyncClient):
    """Verify POST /api/v1/analysis/{id}/follow-up answers contextual question and appends to history."""
    scenarios_res = await async_client.get("/api/v1/scenarios")
    scenario_id = scenarios_res.json()[0]["id"]

    create_res = await async_client.post("/api/v1/analysis", json={"scenario_id": scenario_id})
    analysis_id = create_res.json()["id"]

    # Ask follow-up question
    follow_up_payload = {"question": "What happens if the defending center-back steps into midfield?"}
    fu_res = await async_client.post(f"/api/v1/analysis/{analysis_id}/follow-up", json=follow_up_payload)
    assert fu_res.status_code == 200

    fu_data = fu_res.json()
    assert fu_data["analysis_id"] == analysis_id
    assert fu_data["question"] == follow_up_payload["question"]
    assert len(fu_data["answer"]) > 20
    assert len(fu_data["clarified_tactics"]) > 0

    # Verify conversation history updated
    get_res = await async_client.get(f"/api/v1/analysis/{analysis_id}")
    assert get_res.status_code == 200
    messages = get_res.json()["messages"]
    assert len(messages) >= 4  # 2 original + 2 follow-up


@pytest.mark.asyncio
async def test_analysis_error_handling(async_client: AsyncClient):
    """Verify error handling on invalid IDs and missing entities."""
    random_id = str(uuid.uuid4())

    # Invalid scenario ID on creation
    res1 = await async_client.post("/api/v1/analysis", json={"scenario_id": random_id})
    assert res1.status_code == 404

    # Nonexistent analysis retrieval
    res2 = await async_client.get(f"/api/v1/analysis/{random_id}")
    assert res2.status_code == 404

    # Nonexistent analysis status
    res3 = await async_client.get(f"/api/v1/analysis/{random_id}/status")
    assert res3.status_code == 404

    # Nonexistent follow-up
    res4 = await async_client.post(f"/api/v1/analysis/{random_id}/follow-up", json={"question": "hello?"})
    assert res4.status_code == 404
