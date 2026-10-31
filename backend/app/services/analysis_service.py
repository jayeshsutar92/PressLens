import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.agent.orchestrator import TacticalAgentOrchestrator
from app.core.exceptions import EntityNotFoundError
from app.core.logging import logger
from app.models.analysis import Analysis
from app.models.conversation_message import ConversationMessage
from app.models.scenario import Scenario
from app.schemas.analysis import (
    AnalysisCreateRequest,
    AnalysisDetailResponse,
    AnalysisFollowUpRequest,
    AnalysisFollowUpResponse,
    AnalysisResponse,
    AnalysisStatusResponse,
    ConversationMessageSchema,
    FullTacticalAnalysisReport,
)
from app.services.scenario_service import ScenarioService


class AnalysisService:
    """Service layer managing the end-to-end lifecycle of tactical analyses and conversational follow-ups."""

    @classmethod
    async def create_analysis(
        cls,
        db: AsyncSession,
        request: AnalysisCreateRequest,
    ) -> AnalysisResponse:
        """Executes full tactical agent analysis on a scenario and persists results in PostgreSQL."""
        # 1. Fetch Scenario
        scenario = await ScenarioService.get_scenario_by_id(db, request.scenario_id)
        if not scenario:
            raise EntityNotFoundError("Scenario", request.scenario_id)

        scenario_dict = {
            "id": str(scenario.id),
            "title": scenario.title,
            "description": scenario.description,
            "match_phase": scenario.match_phase,
            "tactical_situation": scenario.tactical_situation,
            "attacking_team": scenario.attacking_team,
            "defending_team": scenario.defending_team,
            "ball_position": scenario.ball_position,
            "match_context": scenario.match_context,
        }

        # 2. Run Single Agent Orchestrator
        orchestrator = TacticalAgentOrchestrator()
        report, spatial_info, tools_executed = await orchestrator.run_analysis(
            db=db,
            scenario_data=scenario_dict,
            user_query=request.user_query,
            focus_areas=request.focus_areas,
        )

        # 3. Persist Analysis Record
        analysis_id = uuid.uuid4()
        metrics_payload = {
            "user_query": request.user_query,
            "structured_analysis": report.model_dump(),
            "spatial_metrics": spatial_info,
            "tools_executed": tools_executed,
            "confidence_score": report.confidence_and_limitations.confidence_score,
        }

        analysis = Analysis(
            id=analysis_id,
            scenario_id=scenario.id,
            tactical_summary=report.situation_overview.summary,
            pressing_intensity=report.pressing_strategy.intensity,
            metrics=metrics_payload,
            status="completed",
        )
        db.add(analysis)

        # 4. Persist Initial Conversation Turns
        query_text = request.user_query if request.user_query else f"Analyze tactical pressing structure for {scenario.title}."
        user_msg = ConversationMessage(
            session_id=str(analysis_id),
            role="user",
            content=query_text,
            msg_metadata={"type": "initial_query"},
        )
        assistant_msg = ConversationMessage(
            session_id=str(analysis_id),
            role="assistant",
            content=report.situation_overview.summary,
            msg_metadata={"summary_highlight": True},
        )
        db.add(user_msg)
        db.add(assistant_msg)

        await db.commit()
        await db.refresh(analysis)

        logger.info("Created analysis %s for scenario '%s' (tools: %s)", analysis.id, scenario.title, tools_executed)

        return AnalysisResponse(
            id=analysis.id,
            scenario_id=scenario.id,
            scenario_title=scenario.title,
            status=analysis.status,
            tactical_summary=analysis.tactical_summary,
            pressing_intensity=analysis.pressing_intensity,
            analysis=report,
            spatial_metrics=spatial_info,
            tools_executed=tools_executed,
            created_at=analysis.created_at,
            updated_at=analysis.updated_at,
        )

    @classmethod
    async def get_analysis_by_id(
        cls,
        db: AsyncSession,
        analysis_id: uuid.UUID,
    ) -> AnalysisDetailResponse:
        """Retrieves a previously generated analysis along with its complete conversation history."""
        stmt = select(Analysis).where(Analysis.id == analysis_id)
        result = await db.execute(stmt)
        analysis = result.scalar_one_or_none()

        if not analysis:
            raise EntityNotFoundError("Analysis", analysis_id)

        # Load Scenario
        scenario = await ScenarioService.get_scenario_by_id(db, analysis.scenario_id)
        scenario_title = scenario.title if scenario else "Tactical Scenario"

        # Load Conversation Messages
        msg_stmt = (
            select(ConversationMessage)
            .where(ConversationMessage.session_id == str(analysis.id))
            .order_by(ConversationMessage.created_at.asc())
        )
        msg_result = await db.execute(msg_stmt)
        messages = list(msg_result.scalars().all())

        # Parse structured report from metrics
        metrics = analysis.metrics or {}
        structured_raw = metrics.get("structured_analysis")
        report: Optional[FullTacticalAnalysisReport] = None
        if structured_raw:
            try:
                report = FullTacticalAnalysisReport.model_validate(structured_raw)
            except Exception as e:
                logger.warning("Failed parsing structured report from metrics: %s", str(e))

        return AnalysisDetailResponse(
            id=analysis.id,
            scenario_id=analysis.scenario_id,
            scenario_title=scenario_title,
            status=analysis.status,
            tactical_summary=analysis.tactical_summary,
            pressing_intensity=analysis.pressing_intensity,
            analysis=report,
            spatial_metrics=metrics.get("spatial_metrics"),
            tools_executed=metrics.get("tools_executed"),
            messages=[ConversationMessageSchema.model_validate(m) for m in messages],
            created_at=analysis.created_at,
            updated_at=analysis.updated_at,
        )

    @classmethod
    async def get_analysis_status(
        cls,
        db: AsyncSession,
        analysis_id: uuid.UUID,
    ) -> AnalysisStatusResponse:
        """Retrieves lightweight execution status for an analysis."""
        stmt = select(Analysis).where(Analysis.id == analysis_id)
        result = await db.execute(stmt)
        analysis = result.scalar_one_or_none()

        if not analysis:
            raise EntityNotFoundError("Analysis", analysis_id)

        metrics = analysis.metrics or {}
        error_msg = metrics.get("error_message")

        return AnalysisStatusResponse(
            id=analysis.id,
            scenario_id=analysis.scenario_id,
            status=analysis.status,
            created_at=analysis.created_at,
            updated_at=analysis.updated_at,
            error_message=error_msg,
        )

    @classmethod
    async def process_follow_up(
        cls,
        db: AsyncSession,
        analysis_id: uuid.UUID,
        request: AnalysisFollowUpRequest,
    ) -> AnalysisFollowUpResponse:
        """Handles contextual follow-up questions referencing previous analysis turns."""
        stmt = select(Analysis).where(Analysis.id == analysis_id)
        result = await db.execute(stmt)
        analysis = result.scalar_one_or_none()

        if not analysis:
            raise EntityNotFoundError("Analysis", analysis_id)

        scenario = await ScenarioService.get_scenario_by_id(db, analysis.scenario_id)
        if not scenario:
            raise EntityNotFoundError("Scenario", analysis.scenario_id)

        scenario_dict = {
            "id": str(scenario.id),
            "title": scenario.title,
            "match_phase": scenario.match_phase,
            "tactical_situation": scenario.tactical_situation,
            "attacking_team": scenario.attacking_team,
            "defending_team": scenario.defending_team,
            "ball_position": scenario.ball_position,
        }

        # Load Conversation History
        msg_stmt = (
            select(ConversationMessage)
            .where(ConversationMessage.session_id == str(analysis.id))
            .order_by(ConversationMessage.created_at.asc())
        )
        msg_result = await db.execute(msg_stmt)
        past_msgs = list(msg_result.scalars().all())

        conv_history = [{"role": m.role, "content": m.content} for m in past_msgs]

        # Run Orchestrator Follow-up
        orchestrator = TacticalAgentOrchestrator()
        answer, players, tactics, citations = await orchestrator.run_follow_up(
            db=db,
            scenario_data=scenario_dict,
            initial_summary=analysis.tactical_summary or "High press tactical scenario",
            conversation_history=conv_history,
            follow_up_question=request.question,
        )

        # Persist New Turn
        user_msg = ConversationMessage(
            session_id=str(analysis.id),
            role="user",
            content=request.question,
        )
        assistant_msg = ConversationMessage(
            session_id=str(analysis.id),
            role="assistant",
            content=answer,
            msg_metadata={
                "relevant_players": players,
                "clarified_tactics": tactics,
                "sources_cited": [c.model_dump() for c in citations],
            },
        )
        db.add(user_msg)
        db.add(assistant_msg)
        await db.commit()
        await db.refresh(assistant_msg)

        return AnalysisFollowUpResponse(
            analysis_id=analysis.id,
            question=request.question,
            answer=answer,
            relevant_players_mentioned=players,
            clarified_tactics=tactics,
            sources_cited=citations,
            created_at=assistant_msg.created_at,
        )
