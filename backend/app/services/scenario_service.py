from typing import List, Optional
import uuid
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import EntityNotFoundError
from app.models.scenario import Scenario
from app.schemas.scenario import ScenarioCreate


class ScenarioService:
    """Service handling business operations and database queries for tactical scenarios."""

    @staticmethod
    async def get_scenarios(
        db: AsyncSession,
        match_phase: Optional[str] = None,
        is_prepared: Optional[bool] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Scenario]:
        query = select(Scenario).order_by(Scenario.created_at.desc())

        if match_phase:
            query = query.where(Scenario.match_phase == match_phase)
        if is_prepared is not None:
            query = query.where(Scenario.is_prepared == is_prepared)

        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_scenario_by_id(
        db: AsyncSession,
        scenario_id: uuid.UUID,
    ) -> Scenario:
        query = select(Scenario).where(Scenario.id == scenario_id)
        result = await db.execute(query)
        scenario = result.scalar_one_or_none()
        if not scenario:
            raise EntityNotFoundError(entity_name="Scenario", entity_id=scenario_id)
        return scenario

    @staticmethod
    async def create_scenario(
        db: AsyncSession,
        scenario_in: ScenarioCreate,
        is_prepared: bool = False,
    ) -> Scenario:
        scenario = Scenario(
            title=scenario_in.title,
            description=scenario_in.description,
            match_phase=scenario_in.match_phase,
            tactical_situation=scenario_in.tactical_situation,
            attacking_team=scenario_in.attacking_team.model_dump(),
            defending_team=scenario_in.defending_team.model_dump(),
            ball_position=scenario_in.ball_position.model_dump(),
            match_context=scenario_in.match_context.model_dump() if scenario_in.match_context else None,
            is_prepared=is_prepared,
            status="active",
        )
        db.add(scenario)
        await db.flush()
        await db.refresh(scenario)
        return scenario

    @staticmethod
    async def delete_scenario(
        db: AsyncSession,
        scenario_id: uuid.UUID,
    ) -> None:
        scenario = await ScenarioService.get_scenario_by_id(db, scenario_id)
        await db.delete(scenario)
        await db.flush()

    @staticmethod
    async def count_scenarios(db: AsyncSession) -> int:
        result = await db.execute(select(func.count(Scenario.id)))
        return result.scalar() or 0

