import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.rag import SourceCitation


# ---------------------------------------------------------------------------
# Structured 10-Section Analysis Models
# ---------------------------------------------------------------------------

class SituationOverview(BaseModel):
    """Overview of the observed scenario, teams, and match context."""
    match_phase: str = Field(..., description="Match phase (e.g. high_press, counter_press, mid_block).")
    tactical_situation: str = Field(..., description="Core tactical state of play.")
    attacking_team_setup: str = Field(..., description="Attacking team formation and structure.")
    defending_team_setup: str = Field(..., description="Defending team formation and pressing setup.")
    ball_location_summary: str = Field(..., description="Pitch zone and description of ball position.")
    summary: str = Field(..., description="2-3 sentence accessible overview of the tactical situation.")


class PressingStrategy(BaseModel):
    """Core pressing philosophy and tactical rationale."""
    intensity: str = Field(..., description="Intensity classification (High, Moderate, Low, Immediate Counter-Press).")
    primary_objective: str = Field(..., description="Why the defending team initiates pressure here.")
    pressing_direction: str = Field(..., description="Direction play is being forced (e.g., touchline funneling, central trap).")
    coordination_scheme: str = Field(..., description="How lines and units coordinate their movements.")


class PressingTriggers(BaseModel):
    """Specific cues that initiate the pressing action."""
    visual_triggers: List[str] = Field(default_factory=list, description="Visual cues triggering the press (e.g. backward pass, ball in air, player facing sideline).")
    tactical_traps: List[str] = Field(default_factory=list, description="Intentional traps baited by the defending block.")
    primary_trigger_player: Optional[str] = Field(None, description="Player responsible for triggering or leading the press.")


class PassingLaneCoverage(BaseModel):
    """Cover shadows, passing lanes blocked, and available outlets."""
    cover_shadows_active: List[str] = Field(default_factory=list, description="Defenders actively casting cover shadows to block passing lanes.")
    blocked_options: List[str] = Field(default_factory=list, description="Attacking options directly obstructed.")
    contested_options: List[str] = Field(default_factory=list, description="Passing avenues under immediate secondary pressure.")
    open_escape_routes: List[str] = Field(default_factory=list, description="Remaining escape lanes or reset options.")


class TacticalAdvantages(BaseModel):
    """Key advantages gained through the pressing structure."""
    compactness_advantage: str = Field(..., description="How spatial compactness limits opponent options.")
    turnover_potential: str = Field(..., description="Where and how turnovers are most likely to occur.")
    key_advantages: List[str] = Field(default_factory=list, description="Specific tactical edges created by this defensive setup.")


class ExposedSpaces(BaseModel):
    """Vulnerabilities, exposed spaces, and trade-offs of the press."""
    exposed_zones: List[str] = Field(default_factory=list, description="Zones left vulnerable (e.g., weak-side flank, space behind fullback, Zone 14).")
    rest_defense_risk: str = Field(..., description="Risk profile of the rest-defense structure if the press is broken.")
    key_vulnerabilities: List[str] = Field(default_factory=list, description="Specific dangers if opponent executes successfully.")


class OppositionResponses(BaseModel):
    """Potential attacking solutions and counter-tactics."""
    recommended_counters: List[str] = Field(default_factory=list, description="Tactical mechanisms to beat or bypass the press.")
    switch_potential: str = Field(..., description="Feasibility of switching play to the opposite flank.")
    third_man_runs: Optional[str] = Field(None, description="Potential third-man combination possibilities.")


class FanWatchPoints(BaseModel):
    """Accessible, engaging points for ordinary fans to watch next."""
    what_to_watch_next: str = Field(..., description="Next decisive action or movement to watch on the pitch.")
    key_duel_to_follow: str = Field(..., description="Individual player matchup that decides the sequence.")
    tactical_takeaway: str = Field(..., description="Simple, memorable concept an ordinary fan can learn from this play.")


class ConfidenceAndLimitations(BaseModel):
    """Confidence level and data limitations."""
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Overall confidence score from 0.0 to 1.0.")
    confidence_level: str = Field(..., description="Confidence rating: High, Medium, or Low.")
    data_sufficiency: str = Field(..., description="Whether scenario context was fully sufficient or limited.")
    limitations: List[str] = Field(default_factory=list, description="Known limitations, assumptions, or missing data points.")


class FullTacticalAnalysisReport(BaseModel):
    """Unified 10-section structured tactical analysis report."""
    situation_overview: SituationOverview
    pressing_strategy: PressingStrategy
    pressing_triggers: PressingTriggers
    passing_lane_coverage: PassingLaneCoverage
    tactical_advantages: TacticalAdvantages
    exposed_spaces: ExposedSpaces
    opposition_responses: OppositionResponses
    fan_watch_points: FanWatchPoints
    confidence_and_limitations: ConfidenceAndLimitations
    supporting_sources: List[SourceCitation] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# API Request & Response Schemas
# ---------------------------------------------------------------------------

class AnalysisCreateRequest(BaseModel):
    """Payload to initiate a tactical analysis for a scenario."""
    scenario_id: uuid.UUID = Field(..., description="Unique identifier of the match scenario.")
    user_query: Optional[str] = Field(
        default=None,
        description="Optional custom tactical question or prompt from the user.",
        max_length=500,
    )
    focus_areas: Optional[List[str]] = Field(
        default=None,
        description="Optional list of specific tactical topics to prioritize (e.g. cover_shadows, triggers, rest_defense).",
    )


class ConversationMessageSchema(BaseModel):
    """Represents a conversation message in the analysis history."""
    id: uuid.UUID
    role: str
    content: str
    msg_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AnalysisResponse(BaseModel):
    """Response returned when an analysis is initiated or retrieved."""
    id: uuid.UUID
    scenario_id: uuid.UUID
    scenario_title: str
    status: str
    tactical_summary: Optional[str] = None
    pressing_intensity: Optional[str] = None
    analysis: Optional[FullTacticalAnalysisReport] = None
    spatial_metrics: Optional[Dict[str, Any]] = None
    tools_executed: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AnalysisDetailResponse(AnalysisResponse):
    """Extended response including conversation history."""
    messages: List[ConversationMessageSchema] = Field(default_factory=list)


class AnalysisStatusResponse(BaseModel):
    """Status check response for an analysis."""
    id: uuid.UUID
    scenario_id: uuid.UUID
    status: str
    created_at: datetime
    updated_at: datetime
    error_message: Optional[str] = None

    model_config = {"from_attributes": True}


class AnalysisFollowUpRequest(BaseModel):
    """Payload to submit a contextual follow-up question."""
    question: str = Field(..., min_length=3, max_length=1000, description="Contextual follow-up question.")


class AnalysisFollowUpResponse(BaseModel):
    """Response returned for a follow-up inquiry."""
    analysis_id: uuid.UUID
    question: str
    answer: str
    relevant_players_mentioned: List[str] = Field(default_factory=list)
    clarified_tactics: List[str] = Field(default_factory=list)
    sources_cited: List[SourceCitation] = Field(default_factory=list)
    created_at: datetime
