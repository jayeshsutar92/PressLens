from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.scenario import (
    ScenarioCreate,
    ScenarioResponse,
    ScenarioSummaryResponse,
)
from app.services.scenario_service import ScenarioService

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])


@router.get(
    "",
    response_model=List[ScenarioSummaryResponse],
    summary="Retrieve Available Scenarios",
    description="Returns a list of available football tactical scenarios with optional filtering by match phase or prepared status.",
    status_code=status.HTTP_200_OK,
)
async def list_scenarios(
    match_phase: Optional[str] = Query(None, description="Filter by match phase (e.g., high_press, counter_press, mid_block)"),
    is_prepared: Optional[bool] = Query(None, description="Filter prepared demo scenarios vs custom scenarios"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Pagination limit"),
    db: AsyncSession = Depends(get_db),
):
    return await ScenarioService.get_scenarios(
        db=db,
        match_phase=match_phase,
        is_prepared=is_prepared,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{scenario_id}",
    response_model=ScenarioResponse,
    summary="Retrieve Specific Scenario Details",
    description="Returns full tactical setup, player coordinates, formations, and ball position for a given scenario ID.",
    status_code=status.HTTP_200_OK,
)
async def get_scenario(
    scenario_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    return await ScenarioService.get_scenario_by_id(db=db, scenario_id=scenario_id)


@router.post(
    "",
    response_model=ScenarioResponse,
    summary="Create Custom Scenario",
    description="Creates a new custom tactical scenario with validated player coordinates and team formations.",
    status_code=status.HTTP_201_CREATED,
)
async def create_scenario(
    scenario_in: ScenarioCreate,
    db: AsyncSession = Depends(get_db),
):
    return await ScenarioService.create_scenario(db=db, scenario_in=scenario_in, is_prepared=False)


@router.delete(
    "/{scenario_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Scenario",
    description="Deletes a scenario by its UUID.",
)
async def delete_scenario(
    scenario_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    await ScenarioService.delete_scenario(db=db, scenario_id=scenario_id)
    return None
