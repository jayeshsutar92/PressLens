from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ToolResult(BaseModel):
    """Standardized result returned by any agent tool."""
    tool_name: str = Field(..., description="Name of the executed tool.")
    success: bool = Field(..., description="Whether the tool execution succeeded.")
    data: Dict[str, Any] = Field(default_factory=dict, description="Structured data output.")
    summary: str = Field(..., description="Brief human-readable summary of the output.")
    error_message: Optional[str] = Field(None, description="Error detail if execution failed.")


class AgentTool(ABC):
    """Abstract base class for all PressLens tactical agent tools."""

    name: str
    description: str

    @abstractmethod
    async def execute(self, **kwargs: Any) -> ToolResult:
        """Executes the tool with structured kwargs and returns a ToolResult."""
        pass
