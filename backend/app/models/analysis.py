import uuid
from typing import Any, Dict, Optional
from sqlalchemy import ForeignKey, String, Text, UUID
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class Analysis(Base, TimestampMixin):
    """Represents a tactical analysis generated for a match scenario."""

    __tablename__ = "analyses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    scenario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("scenarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tactical_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pressing_intensity: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    metrics: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False, index=True)

    # Relationships
    scenario: Mapped["Scenario"] = relationship(
        "Scenario",
        back_populates="analyses",
    )

    def __repr__(self) -> str:
        return f"<Analysis(id={self.id}, scenario_id={self.scenario_id}, status='{self.status}')>"
