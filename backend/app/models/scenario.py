import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy import Boolean, String, Text, UUID
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class Scenario(Base, TimestampMixin):
    """Represents a football match tactical scenario with structured team, player, and pitch data."""

    __tablename__ = "scenarios"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    match_phase: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    tactical_situation: Mapped[str] = mapped_column(String(100), nullable=False)
    attacking_team: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    defending_team: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    ball_position: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    match_context: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    is_prepared: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False, index=True)

    # Relationships
    analyses: Mapped[List["Analysis"]] = relationship(
        "Analysis",
        back_populates="scenario",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Scenario(id={self.id}, title='{self.title}', phase='{self.match_phase}')>"
