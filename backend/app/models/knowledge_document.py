import uuid
from typing import Any, Dict, List
from sqlalchemy import String, Text, UUID
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base, TimestampMixin


class KnowledgeDocument(Base, TimestampMixin):
    """Represents a curated football tactical knowledge document."""

    __tablename__ = "knowledge_documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    topic: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    tactical_principles: Mapped[List[str]] = mapped_column(JSONB, nullable=False, default=list)
    source_metadata: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    tags: Mapped[List[str]] = mapped_column(JSONB, nullable=False, default=list)

    def __repr__(self) -> str:
        return f"<KnowledgeDocument(id={self.id}, title='{self.title}', topic='{self.topic}')>"
