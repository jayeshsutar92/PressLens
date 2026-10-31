from typing import List, Optional
import uuid
from pydantic import BaseModel, Field


class SourceCitation(BaseModel):
    """Citation metadata for a knowledge document chunk referenced in tactical generation."""

    document_title: str = Field(..., description="Title of the cited knowledge source")
    topic: str = Field(..., description="Tactical topic key")
    author: Optional[str] = Field(None, description="Author or coaching body")
    publication: Optional[str] = Field(None, description="Book, manual, or study title")
    relevance_score: float = Field(..., ge=0.0, le=1.0, description="Semantic similarity relevance score")


class TacticalRAGRequest(BaseModel):
    """Request payload for tactical RAG analysis."""

    query: str = Field(..., min_length=3, max_length=1000, description="Tactical question or coaching inquiry")
    scenario_id: Optional[uuid.UUID] = Field(None, description="Optional ID of a specific match scenario to ground against")
    topic: Optional[str] = Field(None, description="Optional topic filter to constrain knowledge retrieval")
    top_k: int = Field(4, ge=1, le=10, description="Maximum number of knowledge chunks to retrieve")


class TacticalRAGResponse(BaseModel):
    """Structured response returned by the tactical RAG pipeline."""

    query: str = Field(..., description="The original tactical query")
    scenario_title: Optional[str] = Field(None, description="Title of the evaluated scenario (if applicable)")
    tactical_analysis: str = Field(..., description="In-depth tactical evaluation grounded in retrieved theory")
    pressing_scheme_evaluation: str = Field(..., description="Evaluation of the pressing setup and spatial dynamics")
    recommended_actions: List[str] = Field(default_factory=list, description="Concrete coaching or tactical adjustments")
    key_risks: List[str] = Field(default_factory=list, description="Tactical vulnerabilities or counter-attack risks")
    sources_cited: List[SourceCitation] = Field(default_factory=list, description="Curated literature citations")
    retrieved_chunks_count: int = Field(..., description="Number of knowledge chunks retrieved for context")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence in the tactical grounding")

