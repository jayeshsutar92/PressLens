from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.knowledge import (
    KnowledgeDocumentCreate,
    KnowledgeDocumentResponse,
    TopicSummaryResponse,
)
from app.services.knowledge_service import KnowledgeService

router = APIRouter(prefix="/knowledge", tags=["Tactical Knowledge"])


@router.get(
    "/topics",
    response_model=List[TopicSummaryResponse],
    summary="Retrieve Available Tactical Topics",
    description="Returns distinct curated tactical topics (e.g., high_pressing, counter_pressing, cover_shadows) with document counts and descriptions.",
    status_code=status.HTTP_200_OK,
)
async def list_topics(
    db: AsyncSession = Depends(get_db),
):
    return await KnowledgeService.get_topics_summary(db=db)


@router.get(
    "/search",
    response_model=List[KnowledgeDocumentResponse],
    summary="Search Curated Tactical Knowledge",
    description="Searches stored tactical knowledge using keywords matching against title, summary, content, category, or tags.",
    status_code=status.HTTP_200_OK,
)
async def search_knowledge(
    q: str = Query(..., min_length=2, description="Search query string"),
    topic: Optional[str] = Query(None, description="Optional topic filter (e.g. high_pressing, cover_shadows)"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Pagination limit"),
    db: AsyncSession = Depends(get_db),
):
    return await KnowledgeService.search_knowledge(
        db=db,
        query_str=q,
        topic=topic,
        skip=skip,
        limit=limit,
    )


@router.get(
    "",
    response_model=List[KnowledgeDocumentResponse],
    summary="List Tactical Knowledge Documents",
    description="Retrieves tactical knowledge documents with optional topic and category filters.",
    status_code=status.HTTP_200_OK,
)
async def list_knowledge_documents(
    topic: Optional[str] = Query(None, description="Filter by tactical topic key"),
    category: Optional[str] = Query(None, description="Filter by category"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Pagination limit"),
    db: AsyncSession = Depends(get_db),
):
    return await KnowledgeService.get_knowledge_documents(
        db=db,
        topic=topic,
        category=category,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{doc_id}",
    response_model=KnowledgeDocumentResponse,
    summary="Retrieve Specific Knowledge Document",
    description="Returns detailed content, tactical principles, and source attribution for a knowledge document.",
    status_code=status.HTTP_200_OK,
)
async def get_knowledge_document(
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    return await KnowledgeService.get_knowledge_document_by_id(db=db, doc_id=doc_id)


@router.post(
    "",
    response_model=KnowledgeDocumentResponse,
    summary="Add Curated Tactical Knowledge Document",
    description="Adds a new factual, curated tactical knowledge entry with verified source attribution.",
    status_code=status.HTTP_201_CREATED,
)
async def create_knowledge_document(
    doc_in: KnowledgeDocumentCreate,
    db: AsyncSession = Depends(get_db),
):
    return await KnowledgeService.create_knowledge_document(db=db, doc_in=doc_in)

