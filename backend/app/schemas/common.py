from typing import Any, Generic, Optional, TypeVar
from pydantic import BaseModel, Field

DataT = TypeVar("DataT")


class ErrorDetails(BaseModel):
    """Standardized error details payload."""

    code: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable error description")
    details: Optional[Any] = Field(None, description="Detailed validation or exception breakdown")


class ResponseEnvelope(BaseModel, Generic[DataT]):
    """Standard API response wrapper."""

    success: bool = Field(True, description="Indicates whether the request was successful")
    data: Optional[DataT] = Field(None, description="Response payload")


class ErrorEnvelope(BaseModel):
    """Standard API error wrapper."""

    success: bool = Field(False, description="Always false for error responses")
    error: ErrorDetails = Field(..., description="Error details object")
