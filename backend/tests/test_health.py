import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_endpoint(async_client: AsyncClient):
    """Verify that the root endpoint returns 200 OK and valid service metadata."""
    response = await async_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "PressLens API" in data["message"]
    assert data["status"] == "running"
    assert data["environment"] == "development"
    assert "/docs" in data["documentation"]["swagger"]


@pytest.mark.asyncio
async def test_health_check_endpoint(async_client: AsyncClient):
    """Verify that the health check endpoint returns database connectivity status."""
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert "version" in data
    assert "timestamp" in data
