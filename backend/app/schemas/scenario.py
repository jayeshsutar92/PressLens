from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


class PlayerPosition(BaseModel):
    """Spatial 2D coordinate on pitch (standard 105m x 68m coordinate frame)."""

    x: float = Field(..., ge=0.0, le=105.0, description="X coordinate on pitch in meters (0 to 105)")
    y: float = Field(..., ge=0.0, le=68.0, description="Y coordinate on pitch in meters (0 to 68)")


class Player(BaseModel):
    """Individual player tactical positioning and role information."""

    id: str = Field(..., description="Unique player identifier within the scenario")
    number: int = Field(..., ge=1, le=99, description="Shirt squad number")
    name: str = Field(..., description="Player display name")
    role: str = Field(..., description="Tactical role (e.g., GK, CB, LB, RB, DM, CM, AM, LW, RW, CF)")
    position: PlayerPosition = Field(..., description="Current spatial pitch position")


class TeamTacticalSetup(BaseModel):
    """Team formation, name and player positioning list."""

    name: str = Field(..., min_length=2, max_length=100, description="Team name")
    formation: str = Field(..., min_length=3, max_length=20, description="Tactical formation (e.g., 4-3-3, 4-2-3-1, 3-5-2)")
    players: List[Player] = Field(..., min_length=1, max_length=11, description="List of positioned players")


class BallPosition(BaseModel):
    """Current location and zone of the match ball."""

    x: float = Field(..., ge=0.0, le=105.0, description="Ball X coordinate on pitch in meters")
    y: float = Field(..., ge=0.0, le=68.0, description="Ball Y coordinate on pitch in meters")
    z: float = Field(0.0, ge=0.0, le=30.0, description="Ball elevation in meters")
    zone: Optional[str] = Field(None, description="Tactical zone description (e.g., Zone 14, Left Half-space)")


class MatchContext(BaseModel):
    """Optional match metadata and dimensions."""

    minute: Optional[int] = Field(None, ge=0, le=130, description="Match clock minute")
    score: Optional[str] = Field(None, description="Current match score (e.g., 1-0)")
    competition: Optional[str] = Field(None, description="Competition name")
    pitch_dimensions: Optional[Dict[str, float]] = Field(
        default_factory=lambda: {"length": 105.0, "width": 68.0},
        description="Pitch dimensions in meters",
    )


class ScenarioBase(BaseModel):
    """Base fields for a tactical scenario."""

    title: str = Field(..., min_length=3, max_length=255, description="Descriptive scenario title")
    description: Optional[str] = Field(None, description="Detailed tactical narrative or context")
    match_phase: str = Field(
        ...,
        description="Phase of play (e.g., high_press, counter_press, build_up, mid_block, low_block, defensive_transition)",
    )
    tactical_situation: str = Field(
        ...,
        description="Specific tactical dilemma (e.g., Opponent Build-Up via Fullback, Midfield Turnover)",
    )
    attacking_team: TeamTacticalSetup = Field(..., description="Team currently in possession")
    defending_team: TeamTacticalSetup = Field(..., description="Team currently defending or pressing")
    ball_position: BallPosition = Field(..., description="Location of the ball")
    match_context: Optional[MatchContext] = Field(default=None, description="Match metadata")


class ScenarioCreate(ScenarioBase):
    """Schema for creating a custom scenario."""
    pass


class ScenarioSummaryResponse(BaseModel):
    """Lightweight scenario summary for list views."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    match_phase: str
    tactical_situation: str
    is_prepared: bool
    status: str
    created_at: datetime
    updated_at: datetime


class ScenarioResponse(ScenarioBase):
    """Full scenario response schema with database metadata."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    is_prepared: bool
    status: str
    created_at: datetime
    updated_at: datetime
