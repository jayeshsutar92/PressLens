from typing import Any, Dict, Optional
from sqlalchemy import JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base, TimestampMixin


class ConversationMessage(Base, TimestampMixin):
    """Represents a message in a tactical analysis conversation or agent chat session."""

    __tablename__ = "conversation_messages"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    msg_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    def __repr__(self) -> str:
        return f"<ConversationMessage(id={self.id}, session_id='{self.session_id}', role='{self.role}')>"
