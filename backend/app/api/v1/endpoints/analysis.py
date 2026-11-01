from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.analysis import (
    AnalysisCreateRequest,
    AnalysisDetailResponse,
    AnalysisFollowUpRequest,
    AnalysisFollowUpResponse,
    AnalysisResponse,
    AnalysisStatusResponse,
)
from app.schemas.rag import TacticalRAGRequest, TacticalRAGResponse
from app.services.analysis_service import AnalysisService
from app.services.rag_service import RAGService

router = APIRouter(prefix="/analysis", tags=["Tactical Analysis & Orchestration"])


@router.post(
    "",
    response_model=AnalysisResponse,
    summary="Initiate Tactical Agent Analysis",
    description="Executes a focused single-agent analysis using specialized inspection, spatial, and RAG tools to produce a 10-section grounded report.",
    status_code=status.HTTP_201_CREATED,
)
async def create_analysis(
    request: AnalysisCreateRequest,
    db: AsyncSession = Depends(get_db),
) -> AnalysisResponse:
    """Initiates tactical analysis on a match scenario."""
    return await AnalysisService.create_analysis(db=db, request=request)


@router.get(
    "",
    response_model=List[AnalysisResponse],
    summary="List Tactical Analyses History",
    description="Returns a paginated list of previously generated analyses with optional scenario filtering.",
    status_code=status.HTTP_200_OK,
)
async def list_analyses(
    scenario_id: Optional[uuid.UUID] = Query(None, description="Optional scenario ID filter"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Pagination limit"),
    db: AsyncSession = Depends(get_db),
) -> List[AnalysisResponse]:
    """Retrieves previous analyses history."""
    return await AnalysisService.get_analyses(
        db=db, scenario_id=scenario_id, skip=skip, limit=limit
    )


@router.get(
    "/{id}",
    response_model=AnalysisDetailResponse,
    summary="Retrieve Tactical Analysis with Conversation History",
    description="Fetches a previously executed analysis, structured tactical sections, spatial metrics, and all conversation turns.",
    status_code=status.HTTP_200_OK,
)
async def get_analysis(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> AnalysisDetailResponse:
    """Retrieves an analysis by its UUID."""
    return await AnalysisService.get_analysis_by_id(db=db, analysis_id=id)


@router.post(
    "/{id}/follow-up",
    response_model=AnalysisFollowUpResponse,
    summary="Submit Contextual Follow-Up Question",
    description="Asks a contextual follow-up question maintaining memory of previous turns, scenario setup, and tactical concepts.",
    status_code=status.HTTP_200_OK,
)
async def submit_follow_up(
    id: uuid.UUID,
    request: AnalysisFollowUpRequest,
    db: AsyncSession = Depends(get_db),
) -> AnalysisFollowUpResponse:
    """Answers a contextual follow-up question for an ongoing analysis session."""
    return await AnalysisService.process_follow_up(db=db, analysis_id=id, request=request)


@router.get(
    "/{id}/status",
    response_model=AnalysisStatusResponse,
    summary="Retrieve Analysis Execution Status",
    description="Returns lightweight execution status and timestamps for an analysis record.",
    status_code=status.HTTP_200_OK,
)
async def get_analysis_status(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> AnalysisStatusResponse:
    """Retrieves status for a given analysis ID."""
    return await AnalysisService.get_analysis_status(db=db, analysis_id=id)


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
) -> TacticalRAGResponse:
    """Executes the standard RAG endpoint for direct tactical inquiries."""
    return await RAGService.analyze_tactical_query(db=db, request=request)
