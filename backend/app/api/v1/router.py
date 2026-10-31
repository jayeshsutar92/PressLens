from fastapi import APIRouter
from app.api.v1.endpoints import health

api_router = APIRouter()

# Mount health endpoints (accessible at /api/v1/health)
api_router.include_router(health.router, tags=["Health"])
