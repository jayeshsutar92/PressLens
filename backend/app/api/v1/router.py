from fastapi import APIRouter
from app.api.v1.endpoints import health, knowledge, scenarios

api_router = APIRouter()

# Mount API v1 route modules
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(scenarios.router)
api_router.include_router(knowledge.router)
