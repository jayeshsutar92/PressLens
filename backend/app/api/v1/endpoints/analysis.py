from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.rag import TacticalRAGRequest, TacticalRAGResponse
from app.services.rag_service import RAGService

router = APIRouter(prefix="/analysis", tags=["Tactical Analysis & RAG"])


@router.post(
    "/tactical-rag",
    response_model=TacticalRAGResponse,
    summary="Tactical Inquiry Analysis with Grounded RAG",
    description="Retrieves relevant tactical theory from PostgreSQL and leverages Groq LLM to generate a grounded analysis with verified citations.",
    status_code=status.HTTP_200_OK,
)
async def analyze_tactical_rag(
    request: TacticalRAGRequest,
    db: AsyncSession = Depends(get_db),
):
    return await RAGService.analyze_tactical_query(db=db, request=request)
