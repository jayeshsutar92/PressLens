from datetime import datetime
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Schema for health check responses."""

    status: str = Field(..., description="Overall service status (healthy, degraded)")
    database: str = Field(..., description="PostgreSQL database connection status (connected, disconnected)")
    version: str = Field(..., description="API service version")
    environment: str = Field(..., description="Deployment environment")
    timestamp: datetime = Field(..., description="Current server UTC timestamp")

