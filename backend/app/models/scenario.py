from typing import Any, Dict, List, Optional
from sqlalchemy import JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class Scenario(Base, TimestampMixin):
    """Represents a football match tactical scenario or snapshot."""

    __tablename__ = "scenarios"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    match_context: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False, index=True)

    # Relationships
    analyses: Mapped[List["Analysis"]] = relationship(
        "Analysis",
        back_populates="scenario",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Scenario(id={self.id}, title='{self.title}', status='{self.status}')>"
