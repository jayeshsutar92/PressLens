from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.agent.tools.base import AgentTool, ToolResult
from app.core.config import settings
from app.core.logging import logger
from app.schemas.rag import SourceCitation
from app.services.knowledge_service import KnowledgeService


class KnowledgeRetrievalTool(AgentTool):
    """Tool to retrieve grounded tactical football concepts from the PostgreSQL vector store."""

    name: str = "tactical_knowledge_retrieval"
    description: str = "Searches curated football tactical literature and vector embeddings for pressing theory, triggers, and traps."

    async def execute(self, **kwargs: Any) -> ToolResult:
        """Executes semantic retrieval.

        Expected kwargs:
            db (AsyncSession): SQLAlchemy async database session.
            query (str): Tactical query to retrieve concepts for.
            topic (str, optional): Filter by tactical topic.
            top_k (int, optional): Maximum chunks to return.
        """
        db: Optional[AsyncSession] = kwargs.get("db")
        query: str = kwargs.get("query", "")
        topic: Optional[str] = kwargs.get("topic")
        top_k: int = kwargs.get("top_k", settings.RAG_TOP_K)

        if not db:
            return ToolResult(
                tool_name=self.name,
                success=False,
                summary="Failed: Database session not provided.",
                error_message="Missing db session",
            )

        if not query:
            return ToolResult(
                tool_name=self.name,
                success=False,
                summary="Failed: Search query cannot be empty.",
                error_message="Empty query parameter",
            )

        try:
            chunks_with_scores = await KnowledgeService.semantic_search_chunks(
                db=db,
                query_text=query,
                topic=topic,
                top_k=top_k,
                min_similarity=settings.RAG_MIN_SIMILARITY,
            )

            citations: List[SourceCitation] = []
            seen_titles = set()
            chunk_data: List[Dict[str, Any]] = []

            for chunk, score in chunks_with_scores:
                meta = chunk.chunk_metadata or {}
                title = meta.get("source_title", "Curated Tactical Document")
                if title not in seen_titles:
                    seen_titles.add(title)
                    citations.append(
                        SourceCitation(
                            document_title=title,
                            topic=meta.get("topic", "general_tactics"),
                            author=meta.get("author"),
                            publication=meta.get("source_title"),
                            relevance_score=round(score, 3),
                        )
                    )

                chunk_data.append({
                    "title": title,
                    "topic": meta.get("topic"),
                    "content": chunk.content,
                    "relevance_score": round(score, 3),
                })

            summary = (
                f"Retrieved {len(chunk_data)} tactical knowledge chunks with {len(citations)} unique sources "
                f"for query: '{query}'."
            )

            return ToolResult(
                tool_name=self.name,
                success=True,
                data={
                    "chunks": chunk_data,
                    "citations": [c.model_dump() for c in citations],
                    "count": len(chunk_data),
                    "query": query,
                },
                summary=summary,
            )

        except Exception as err:
            logger.error("KnowledgeRetrievalTool failed: %s", str(err), exc_info=True)
            return ToolResult(
                tool_name=self.name,
                success=False,
                summary=f"Knowledge retrieval error: {str(err)}",
                error_message=str(err),
            )
