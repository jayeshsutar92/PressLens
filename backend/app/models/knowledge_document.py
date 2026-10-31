from typing import Any, Dict, Optional
from sqlalchemy import JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base, TimestampMixin


class KnowledgeDocument(Base, TimestampMixin):
    """Represents a football tactical reference document or theoretical knowledge chunk."""

    __tablename__ = "knowledge_documents"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    doc_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    def __repr__(self) -> str:
        return f"<KnowledgeDocument(id={self.id}, title='{self.title}', category='{self.category}')>"
