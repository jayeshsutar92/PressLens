import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_analyses_endpoint(async_client: AsyncClient):
    """GET /api/v1/analysis should return a paginated list of previous analyses."""
    # First get an existing scenario
    scenarios_resp = await async_client.get("/api/v1/scenarios")
    assert scenarios_resp.status_code == 200
    scenarios = scenarios_resp.json()
    assert len(scenarios) > 0
    scenario_id = scenarios[0]["id"]

    # Create an analysis to guarantee at least one record exists
    create_resp = await async_client.post(
        "/api/v1/analysis",
        json={
            "scenario_id": scenario_id,
            "user_query": "Testing list history endpoint",
        },
    )
    assert create_resp.status_code == 201

    # List all analyses
    list_resp = await async_client.get("/api/v1/analysis?limit=10&skip=0")
    assert list_resp.status_code == 200
    analyses = list_resp.json()
    assert isinstance(analyses, list)
    assert len(analyses) >= 1

    # Verify response schema fields
    first = analyses[0]
    assert "id" in first
    assert "scenario_id" in first
    assert "scenario_title" in first
    assert "status" in first
    assert "created_at" in first

    # Test filtering by scenario_id
    filtered_resp = await async_client.get(f"/api/v1/analysis?scenario_id={scenario_id}")
    assert filtered_resp.status_code == 200
    filtered_list = filtered_resp.json()
    assert all(a["scenario_id"] == scenario_id for a in filtered_list)

