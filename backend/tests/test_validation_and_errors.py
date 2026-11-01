import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_scenario_create_validation_missing_fields(async_client: AsyncClient):
    """Creating a scenario with missing required fields should return 422 with structured validation error."""
    response = await async_client.post(
        "/api/v1/scenarios",
        json={"title": "Incomplete Scenario"},
    )
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "details" in data["error"]


@pytest.mark.asyncio
async def test_scenario_create_validation_invalid_pitch_coordinates(async_client: AsyncClient):
    """Creating a scenario with coordinates outside 105m x 68m regulation pitch should return 422."""
    payload = {
        "title": "Invalid Pitch Coordinates",
        "match_phase": "high_press",
        "tactical_situation": "Testing out-of-bounds player positions",
        "attacking_team": {
            "name": "Team A",
            "formation": "4-3-3",
            "players": [
                {
                    "id": "p1",
                    "number": 1,
                    "name": "Out of Bounds Player",
                    "role": "GK",
                    "position": {"x": 150.0, "y": 99.0},  # Exceeds 105m and 68m bounds
                }
            ],
        },
        "defending_team": {
            "name": "Team B",
            "formation": "4-4-2",
            "players": [
                {
                    "id": "d1",
                    "number": 1,
                    "name": "Valid GK",
                    "role": "GK",
                    "position": {"x": 90.0, "y": 34.0},
                }
            ],
        },
        "ball_position": {"x": 120.0, "y": 34.0},  # Exceeds 105m bound
    }

    response = await async_client.post("/api/v1/scenarios", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_get_scenario_invalid_uuid_format(async_client: AsyncClient):
    """Requesting a scenario with a non-UUID identifier should return 422."""
    response = await async_client.get("/api/v1/scenarios/not-a-valid-uuid")
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_get_nonexistent_scenario_returns_404(async_client: AsyncClient):
    """Requesting a non-existent scenario UUID should return 404."""
    random_id = str(uuid.uuid4())
    response = await async_client.get(f"/api/v1/scenarios/{random_id}")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "ENTITY_NOT_FOUND"


@pytest.mark.asyncio
async def test_delete_nonexistent_scenario_returns_404(async_client: AsyncClient):
    """Deleting a non-existent scenario UUID should return 404."""
    random_id = str(uuid.uuid4())
    response = await async_client.delete(f"/api/v1/scenarios/{random_id}")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "ENTITY_NOT_FOUND"


@pytest.mark.asyncio
async def test_knowledge_search_query_too_short(async_client: AsyncClient):
    """Searching tactical knowledge with a query shorter than min_length (2) should return 422."""
    response = await async_client.get("/api/v1/knowledge/search?q=a")
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_get_nonexistent_knowledge_doc_returns_404(async_client: AsyncClient):
    """Requesting a non-existent knowledge document UUID should return 404."""
    random_id = str(uuid.uuid4())
    response = await async_client.get(f"/api/v1/knowledge/{random_id}")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "ENTITY_NOT_FOUND"


@pytest.mark.asyncio
async def test_analysis_nonexistent_scenario_returns_404(async_client: AsyncClient):
    """Initiating analysis for a non-existent scenario UUID should return 404."""
    random_id = str(uuid.uuid4())
    response = await async_client.post(
        "/api/v1/analysis",
        json={"scenario_id": random_id, "user_query": "Analyze non-existent"},
    )
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "ENTITY_NOT_FOUND"


@pytest.mark.asyncio
async def test_analysis_get_nonexistent_id_returns_404(async_client: AsyncClient):
    """Retrieving a non-existent analysis record UUID should return 404."""
    random_id = str(uuid.uuid4())
    response = await async_client.get(f"/api/v1/analysis/{random_id}")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "ENTITY_NOT_FOUND"


@pytest.mark.asyncio
async def test_analysis_status_nonexistent_id_returns_404(async_client: AsyncClient):
    """Retrieving status for a non-existent analysis UUID should return 404."""
    random_id = str(uuid.uuid4())
    response = await async_client.get(f"/api/v1/analysis/{random_id}/status")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "ENTITY_NOT_FOUND"


@pytest.mark.asyncio
async def test_follow_up_nonexistent_analysis_returns_404(async_client: AsyncClient):
    """Submitting a follow-up for a non-existent analysis UUID should return 404."""
    random_id = str(uuid.uuid4())
    response = await async_client.post(
        f"/api/v1/analysis/{random_id}/follow-up",
        json={"question": "Why did the presser step out?"},
    )
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "ENTITY_NOT_FOUND"


@pytest.mark.asyncio
async def test_follow_up_question_too_short(async_client: AsyncClient):
    """Submitting a follow-up with question shorter than min_length (3) should return 422."""
    random_id = str(uuid.uuid4())
    response = await async_client.post(
        f"/api/v1/analysis/{random_id}/follow-up",
        json={"question": "no"},
    )
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "VALIDATION_ERROR"
