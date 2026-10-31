import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_scenarios_returns_prepared_scenarios(async_client: AsyncClient):
    """Verify scenarios endpoint returns demonstration scenarios."""
    response = await async_client.get("/api/v1/scenarios")
    assert response.status_code == 200
    scenarios = response.json()
    assert isinstance(scenarios, list)
    assert len(scenarios) >= 3

    # Check structure of items
    first = scenarios[0]
    assert "id" in first
    assert "title" in first
    assert "match_phase" in first
    assert "is_prepared" in first
    assert first["is_prepared"] is True


@pytest.mark.asyncio
async def test_filter_scenarios_by_match_phase(async_client: AsyncClient):
    """Verify filtering scenarios by match_phase."""
    response = await async_client.get("/api/v1/scenarios?match_phase=high_press")
    assert response.status_code == 200
    scenarios = response.json()
    assert len(scenarios) >= 1
    for sc in scenarios:
        assert sc["match_phase"] == "high_press"


@pytest.mark.asyncio
async def test_get_scenario_by_id(async_client: AsyncClient):
    """Verify retrieving full scenario details by ID."""
    list_res = await async_client.get("/api/v1/scenarios")
    scenario_id = list_res.json()[0]["id"]

    response = await async_client.get(f"/api/v1/scenarios/{scenario_id}")
    assert response.status_code == 200
    scenario = response.json()
    assert scenario["id"] == scenario_id
    assert "attacking_team" in scenario
    assert "defending_team" in scenario
    assert "ball_position" in scenario
    assert len(scenario["attacking_team"]["players"]) > 0
    assert len(scenario["defending_team"]["players"]) > 0


@pytest.mark.asyncio
async def test_get_nonexistent_scenario_returns_404(async_client: AsyncClient):
    """Verify 404 when querying an unknown scenario UUID."""
    random_id = uuid.uuid4()
    response = await async_client.get(f"/api/v1/scenarios/{random_id}")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "ENTITY_NOT_FOUND"


@pytest.mark.asyncio
async def test_create_and_delete_custom_scenario(async_client: AsyncClient):
    """Verify creating a custom scenario and subsequently deleting it."""
    payload = {
        "title": "Custom Test 4-3-3 High Press",
        "description": "Custom testing scenario for pressing trigger analysis",
        "match_phase": "high_press",
        "tactical_situation": "Opponent GK short pass trap",
        "attacking_team": {
            "name": "Team A",
            "formation": "4-3-3",
            "players": [
                {"id": "p1", "number": 1, "name": "Keeper", "role": "GK", "position": {"x": 5.0, "y": 34.0}},
                {"id": "p2", "number": 4, "name": "CenterBack", "role": "CB", "position": {"x": 15.0, "y": 28.0}},
            ],
        },
        "defending_team": {
            "name": "Team B",
            "formation": "4-4-2",
            "players": [
                {"id": "d1", "number": 9, "name": "Striker", "role": "CF", "position": {"x": 20.0, "y": 30.0}},
            ],
        },
        "ball_position": {"x": 15.5, "y": 28.5, "z": 0.0, "zone": "Defensive Third"},
        "match_context": {"minute": 10, "score": "0-0"},
    }

    create_res = await async_client.post("/api/v1/scenarios", json=payload)
    assert create_res.status_code == 201
    created_data = create_res.json()
    created_id = created_data["id"]
    assert created_data["title"] == payload["title"]
    assert created_data["is_prepared"] is False

    # Retrieve created scenario
    get_res = await async_client.get(f"/api/v1/scenarios/{created_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == created_id

    # Delete scenario
    del_res = await async_client.delete(f"/api/v1/scenarios/{created_id}")
    assert del_res.status_code == 204

    # Confirm deletion
    get_after_del = await async_client.get(f"/api/v1/scenarios/{created_id}")
    assert get_after_del.status_code == 404

