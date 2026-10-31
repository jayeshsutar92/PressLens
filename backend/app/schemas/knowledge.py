from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


class SourceMetadata(BaseModel):
    """Source traceability information for curated tactical knowledge."""

    author: Optional[str] = Field(None, description="Primary author or tactical analyst")
    publication: Optional[str] = Field(None, description="Book, manual, or organizational publication")
    year: Optional[int] = Field(None, description="Year of publication")
    title: Optional[str] = Field(None, description="Title of the source publication or study")
    url: Optional[str] = Field(None, description="Official citation or reference URL")
    verification_status: str = Field(
        "verified",
        description="Verification state (e.g., verified, curated, official_manual)",
    )


class KnowledgeDocumentBase(BaseModel):
    """Base schema for tactical knowledge documents."""

    title: str = Field(..., min_length=3, max_length=255, description="Document headline")
    topic: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Tactical topic key (e.g., high_pressing, counter_pressing, pressing_triggers, cover_shadows)",
    )
    category: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Top-level tactical category (e.g., pressing_mechanics, defensive_structure, transitions)",
    )
    summary: str = Field(..., min_length=10, description="Concise tactical abstract")
    content: str = Field(..., min_length=20, description="In-depth theoretical explanation and coaching guidance")
    tactical_principles: List[str] = Field(
        default_factory=list,
        description="Key bullet points or golden rules for this concept",
    )
    source_metadata: SourceMetadata = Field(..., description="Attribution metadata")
    tags: List[str] = Field(default_factory=list, description="Searchable keyword tags")


class KnowledgeDocumentCreate(KnowledgeDocumentBase):
    """Schema for adding new curated tactical knowledge."""
    pass


class KnowledgeDocumentResponse(KnowledgeDocumentBase):
    """Full knowledge document response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class TopicSummaryResponse(BaseModel):
    """Summary of an available tactical topic."""

    topic: str
    category: str
    document_count: int
    description: str

