from unittest.mock import patch
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


@pytest.mark.asyncio
async def test_health_check_database_disconnected_returns_503(async_client: AsyncClient):
    """When DB connection check fails, /api/v1/health should return 503 SERVICE UNAVAILABLE with degraded status."""
    with patch("app.api.v1.endpoints.health.check_db_connection", return_value=False):
        response = await async_client.get("/api/v1/health")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "degraded"
        assert data["database"] == "disconnected"


@pytest.mark.asyncio
async def test_health_check_schema_missing_returns_503(async_client: AsyncClient):
    """When DB is connected but required tables are missing, /health should report degraded and return 503."""
    with patch("app.api.v1.endpoints.health.check_schema_readiness", return_value=False):
        response = await async_client.get("/api/v1/health")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "degraded"
        assert data["database"] == "connected"


@pytest.mark.asyncio
async def test_cors_preflight_production_vercel_origin(async_client: AsyncClient):
    """Verify that preflight OPTIONS request from https://press-lens-one.vercel.app is allowed with proper headers."""
    headers = {
        "Origin": "https://press-lens-one.vercel.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    }
    response = await async_client.options("/api/v1/analysis", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://press-lens-one.vercel.app"
    assert "POST" in response.headers.get("access-control-allow-methods", "")
