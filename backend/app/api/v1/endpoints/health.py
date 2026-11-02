from datetime import datetime, timezone
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.db.session import check_db_connection, check_schema_readiness
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service and Database Health Check",
    description="Returns the health status of the PressLens API, database connectivity, and schema readiness.",
    status_code=status.HTTP_200_OK,
)
async def health_check():
    db_connected = await check_db_connection()
    schema_ready = await check_schema_readiness() if db_connected else False
    is_healthy = db_connected and schema_ready

    overall_status = "healthy" if is_healthy else "degraded"
    db_status = "connected" if db_connected else "disconnected"

    response_data = HealthResponse(
        status=overall_status,
        database=db_status,
        version=settings.VERSION,
        environment=settings.APP_ENV,
        timestamp=datetime.now(timezone.utc),
    )

    if not is_healthy:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=response_data.model_dump(mode="json"),
        )

    return response_data

