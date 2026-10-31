from typing import Dict, List, Optional
import uuid
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import EntityNotFoundError
from app.models.knowledge_document import KnowledgeDocument
from app.schemas.knowledge import KnowledgeDocumentCreate, TopicSummaryResponse

# Human-friendly descriptions for primary tactical topics
TOPIC_DESCRIPTIONS: Dict[str, str] = {
    "high_pressing": "Structural principles, trigger moments, and line heights for winning possession in the final third.",
    "counter_pressing": "Immediate ball-oriented rest-defense and transition pressing within 5 seconds of possession loss.",
    "pressing_triggers": "Visual cues and technical errors that trigger coordinated multi-player pressing runs.",
    "cover_shadows": "Body orientation and angles that block progressive passing lanes while approaching ball carriers.",
    "defensive_compactness": "Maintaining minimal vertical and horizontal distances between defensive and midfield lines.",
    "pressing_traps": "Deliberately inviting passes into wide or central areas to isolate carriers and force turnovers.",
    "passing_lane_coverage": "Zonal positioning to anticipate and intercept passes without breaking defensive shape.",
    "defensive_transitions": "Rest-defense coordination and tactical recovery during the negative transition phase.",
}


class KnowledgeService:
    """Service handling curated football tactical knowledge queries and keyword search."""

    @staticmethod
    async def get_knowledge_documents(
        db: AsyncSession,
        topic: Optional[str] = None,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[KnowledgeDocument]:
        query = select(KnowledgeDocument).order_by(KnowledgeDocument.title.asc())

        if topic:
            query = query.where(KnowledgeDocument.topic == topic)
        if category:
            query = query.where(KnowledgeDocument.category == category)

        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_knowledge_document_by_id(
        db: AsyncSession,
        doc_id: uuid.UUID,
    ) -> KnowledgeDocument:
        query = select(KnowledgeDocument).where(KnowledgeDocument.id == doc_id)
        result = await db.execute(query)
        doc = result.scalar_one_or_none()
        if not doc:
            raise EntityNotFoundError(entity_name="KnowledgeDocument", entity_id=doc_id)
        return doc

    @staticmethod
    async def create_knowledge_document(
        db: AsyncSession,
        doc_in: KnowledgeDocumentCreate,
    ) -> KnowledgeDocument:
        doc = KnowledgeDocument(
            title=doc_in.title,
            topic=doc_in.topic,
            category=doc_in.category,
            summary=doc_in.summary,
            content=doc_in.content,
            tactical_principles=doc_in.tactical_principles,
            source_metadata=doc_in.source_metadata.model_dump(),
            tags=doc_in.tags,
        )
        db.add(doc)
        await db.flush()
        await db.refresh(doc)
        return doc

    @staticmethod
    async def search_knowledge(
        db: AsyncSession,
        query_str: str,
        topic: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[KnowledgeDocument]:
        search_term = f"%{query_str.lower().strip()}%"

        # Search across title, summary, content, category, or topic
        criteria = or_(
            func.lower(KnowledgeDocument.title).like(search_term),
            func.lower(KnowledgeDocument.summary).like(search_term),
            func.lower(KnowledgeDocument.content).like(search_term),
            func.lower(KnowledgeDocument.topic).like(search_term),
            func.lower(KnowledgeDocument.category).like(search_term),
        )

        query = select(KnowledgeDocument).where(criteria)
        if topic:
            query = query.where(KnowledgeDocument.topic == topic)

        query = query.order_by(KnowledgeDocument.title.asc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_topics_summary(db: AsyncSession) -> List[TopicSummaryResponse]:
        query = (
            select(
                KnowledgeDocument.topic,
                KnowledgeDocument.category,
                func.count(KnowledgeDocument.id).label("doc_count"),
            )
            .group_by(KnowledgeDocument.topic, KnowledgeDocument.category)
            .order_by(KnowledgeDocument.topic.asc())
        )
        result = await db.execute(query)

        topics_list: List[TopicSummaryResponse] = []
        for row in result.all():
            topic_key = row[0]
            cat = row[1]
            cnt = row[2]
            desc = TOPIC_DESCRIPTIONS.get(
                topic_key,
                f"Curated tactical principles for {topic_key.replace('_', ' ')}.",
            )
            topics_list.append(
                TopicSummaryResponse(
                    topic=topic_key,
                    category=cat,
                    document_count=cnt,
                    description=desc,
                )
            )
        return topics_list

    @staticmethod
    async def count_documents(db: AsyncSession) -> int:
        result = await db.execute(select(func.count(KnowledgeDocument.id)))
        return result.scalar() or 0
