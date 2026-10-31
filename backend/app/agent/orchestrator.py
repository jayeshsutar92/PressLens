import json
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from app.agent.prompts.analysis_prompts import build_analysis_prompt, build_follow_up_prompt
from app.agent.tools.base import ToolResult
from app.agent.tools.knowledge_tool import KnowledgeRetrievalTool
from app.agent.tools.relationship_tool import TacticalRelationshipTool
from app.agent.tools.scenario_tool import ScenarioInspectionTool
from app.agent.tools.validation_tool import ContextValidationTool
from app.core.exceptions import AIProviderError, ConfigurationError
from app.core.logging import logger
from app.integrations.groq_client import GroqClient
from app.schemas.analysis import (
    ConfidenceAndLimitations,
    ExposedSpaces,
    FanWatchPoints,
    FullTacticalAnalysisReport,
    OppositionResponses,
    PassingLaneCoverage,
    PressingStrategy,
    PressingTriggers,
    SituationOverview,
    TacticalAdvantages,
)
from app.schemas.rag import SourceCitation


class TacticalAgentOrchestrator:
    """Orchestrates focused single-agent football pressing analysis using specialized tools."""

    def __init__(self) -> None:
        self.validation_tool = ContextValidationTool()
        self.scenario_tool = ScenarioInspectionTool()
        self.relationship_tool = TacticalRelationshipTool()
        self.knowledge_tool = KnowledgeRetrievalTool()

    async def run_analysis(
        self,
        db: AsyncSession,
        scenario_data: Dict[str, Any],
        user_query: Optional[str] = None,
        focus_areas: Optional[List[str]] = None,
    ) -> Tuple[FullTacticalAnalysisReport, Dict[str, Any], List[str]]:
        """Executes full tactical analysis pipeline.

        Returns:
            Tuple of (FullTacticalAnalysisReport, spatial_metrics_dict, tools_executed_list).
        """
        tools_executed: List[str] = []

        # 1. Tool: Context Validation
        validation_res = await self.validation_tool.execute(
            scenario_data=scenario_data,
            user_query=user_query,
        )
        tools_executed.append(self.validation_tool.name)
        validation_data = validation_res.data

        # 2. Tool: Scenario Inspection
        inspection_res = await self.scenario_tool.execute(scenario_data=scenario_data)
        tools_executed.append(self.scenario_tool.name)
        scenario_info = inspection_res.data

        # 3. Tool: Tactical Relationship & Spatial Analysis
        relationship_res = await self.relationship_tool.execute(scenario_data=scenario_data)
        tools_executed.append(self.relationship_tool.name)
        spatial_info = relationship_res.data

        # 4. Tool: Knowledge Retrieval (RAG)
        retrieval_query = user_query if user_query and user_query.strip() else (
            f"{scenario_data.get('match_phase', 'pressing')} {scenario_data.get('tactical_situation', '')} "
            f"cover shadows pressing triggers"
        )
        if focus_areas:
            retrieval_query += f" {' '.join(focus_areas)}"

        knowledge_res = await self.knowledge_tool.execute(
            db=db,
            query=retrieval_query,
            topic=scenario_data.get("match_phase"),
            top_k=4,
        )
        tools_executed.append(self.knowledge_tool.name)
        knowledge_chunks = knowledge_res.data.get("chunks", [])
        citations_data = knowledge_res.data.get("citations", [])
        citations = [SourceCitation(**c) for c in citations_data]

        # 5. Build Grounded Prompt
        messages = build_analysis_prompt(
            user_query=user_query,
            scenario_info=scenario_info,
            spatial_info=spatial_info,
            validation_info=validation_data,
            knowledge_chunks=knowledge_chunks,
        )

        # 6. LLM Generation with Fallback Resilience
        try:
            report = await GroqClient.chat_completion_structured(
                messages=messages,
                schema_class=FullTacticalAnalysisReport,
            )
            # Ensure supporting sources and confidence accurately reflect verified tools
            report.supporting_sources = citations
            if not validation_data.get("is_sufficient", True):
                report.confidence_and_limitations.confidence_level = validation_data.get("confidence_level", "Low")
                report.confidence_and_limitations.confidence_score = validation_data.get("confidence_score", 0.40)
                report.confidence_and_limitations.limitations = validation_data.get("limitations", [])

            return report, spatial_info, tools_executed

        except (ConfigurationError, AIProviderError) as llm_err:
            logger.warning("Groq call failed (%s). Generating deterministic grounded analysis report.", str(llm_err))
            fallback_report = self._build_deterministic_report(
                scenario_data=scenario_data,
                scenario_info=scenario_info,
                spatial_info=spatial_info,
                validation_data=validation_data,
                citations=citations,
            )
            return fallback_report, spatial_info, tools_executed

    async def run_follow_up(
        self,
        db: AsyncSession,
        scenario_data: Dict[str, Any],
        initial_summary: str,
        conversation_history: List[Dict[str, str]],
        follow_up_question: str,
    ) -> Tuple[str, List[str], List[str], List[SourceCitation]]:
        """Executes a contextual follow-up question.

        Returns:
            Tuple of (answer_text, players_mentioned, tactics_clarified, citations).
        """
        # Determine if new tactical literature is needed
        additional_chunks: List[Dict[str, Any]] = []
        citations: List[SourceCitation] = []

        k_res = await self.knowledge_tool.execute(
            db=db,
            query=follow_up_question,
            top_k=2,
        )
        if k_res.success:
            additional_chunks = k_res.data.get("chunks", [])
            citations = [SourceCitation(**c) for c in k_res.data.get("citations", [])]

        inspection_res = await self.scenario_tool.execute(scenario_data=scenario_data)
        scenario_info = inspection_res.data

        messages = build_follow_up_prompt(
            follow_up_question=follow_up_question,
            scenario_info=scenario_info,
            initial_analysis_summary=initial_summary,
            conversation_history=conversation_history,
            additional_knowledge=additional_chunks,
        )

        try:
            resp_str = await GroqClient.chat_completion(
                messages=messages,
                response_format={"type": "json_object"},
            )
            data = json.loads(resp_str)
            return (
                data.get("answer", resp_str),
                data.get("relevant_players_mentioned", []),
                data.get("clarified_tactics", []),
                citations,
            )
        except Exception as err:
            logger.warning("Groq follow-up generation failed (%s). Using fallback synthesis.", str(err))
            answer, players, tactics = self._build_follow_up_fallback(
                question=follow_up_question,
                scenario_data=scenario_data,
            )
            return answer, players, tactics, citations

    def _build_deterministic_report(
        self,
        scenario_data: Dict[str, Any],
        scenario_info: Dict[str, Any],
        spatial_info: Dict[str, Any],
        validation_data: Dict[str, Any],
        citations: List[SourceCitation],
    ) -> FullTacticalAnalysisReport:
        """Deterministic grounded fallback report generated entirely from tool outputs and tactical theory."""
        title = scenario_data.get("title", "Match Scenario")
        phase = scenario_data.get("match_phase", "high_press")
        situation = scenario_data.get("tactical_situation", "defensive pressing setup")

        bc = spatial_info.get("ball_carrier", {})
        bc_name = f"#{bc.get('number', '')} {bc.get('name', 'Ball Carrier')}"
        bc_role = bc.get("role", "Player")

        pp = spatial_info.get("primary_presser") or {}
        pp_name = f"#{pp.get('number', '')} {pp.get('name', 'Primary Presser')}"
        pp_role = pp.get("role", "Defender")
        pp_dist = pp.get("distance_to_ball", 5.0)

        funnel = spatial_info.get("pressing_funnel", "touchline_lock")
        comp = spatial_info.get("compactness", {})
        length_m = comp.get("vertical_block_length_meters", 30.0)
        width_m = comp.get("horizontal_block_width_meters", 45.0)

        lanes = spatial_info.get("passing_lanes", [])
        shadowed = [l["target_player"] for l in lanes if l.get("status") == "blocked_by_cover_shadow"]
        contested = [l["target_player"] for l in lanes if l.get("status") == "contested"]
        open_opts = spatial_info.get("open_options", [])

        # 1. Situation Overview
        sit_overview = SituationOverview(
            match_phase=phase,
            tactical_situation=situation,
            attacking_team_setup=f"{scenario_info.get('attacking_team', {}).get('name', 'Attacking')} ({scenario_info.get('attacking_team', {}).get('formation', '4-3-3')})",
            defending_team_setup=f"{scenario_info.get('defending_team', {}).get('name', 'Defending')} ({scenario_info.get('defending_team', {}).get('formation', '4-3-3')})",
            ball_location_summary=f"Zone '{scenario_data.get('ball_position', {}).get('zone', 'Field')}' at x={bc.get('coordinates', {}).get('x')}, y={bc.get('coordinates', {}).get('y')}",
            summary=(
                f"{scenario_info.get('defending_team', {}).get('name', 'The defending block')} initiates pressure in the {phase} "
                f"against {bc_name} ({bc_role}). The unit maintains a compact vertical block of {length_m}m, "
                f"funneling the attack toward {funnel.replace('_', ' ')}."
            ),
        )

        # 2. Pressing Strategy
        press_strategy = PressingStrategy(
            intensity="High Press" if "high" in phase.lower() else "Intense Counter-Press",
            primary_objective=f"Deny central progression through Zone 14 and isolate {bc_name} against the boundary.",
            pressing_direction=f"Funneling via {funnel.replace('_', ' ')} to trap ball in wide corridors.",
            coordination_scheme=(
                f"{pp_name} presses the ball while supporting defenders step up to compress horizontal width to {width_m}m, "
                f"denying direct passing angles to central midfielders."
            ),
        )

        # 3. Pressing Triggers
        triggers = PressingTriggers(
            visual_triggers=[
                f"Ball played into {bc_role} with back/side to central pitch",
                "Touch directed toward the touchline boundary",
                "Distance to nearest defender closed under 5 meters",
            ],
            tactical_traps=[
                "Baiting the initial pass into the half-space before closing passing lanes simultaneously",
                "Allowing the wide fullback to receive before sealing the touchline with overlapping press",
            ],
            primary_trigger_player=pp_name,
        )

        # 4. Passing Lane Coverage
        lane_coverage = PassingLaneCoverage(
            cover_shadows_active=shadowed[:3] if shadowed else ["Central passing avenues blocked by midfield screening"],
            blocked_options=shadowed[:3] if shadowed else ["Direct vertical line to attacking midfielder"],
            contested_options=contested[:2] if contested else ["Short lateral recycling pass"],
            open_escape_routes=open_opts[:2] if open_opts else ["Deep backward pass to goalkeeper", "Long switch to weak side"],
        )

        # 5. Tactical Advantages
        tactical_adv = TacticalAdvantages(
            compactness_advantage=f"Block depth of {length_m}m prevents opponents from finding pockets between defensive and midfield lines.",
            turnover_potential=f"High turnover probability within 15 meters of ball location if {bc_name} is forced into a rushed clearance.",
            key_advantages=[
                "Numerical superiority generated around the active ball corridor",
                "Immediate transition opportunity into opponent penalty box upon dispossessing ball carrier",
                "Minimizes opposition forward passes into dangerous central zones",
            ],
        )

        # 6. Exposed Spaces
        exposed = ExposedSpaces(
            exposed_zones=[
                "Opposite weak-side flank due to horizontal block shifting",
                "Space behind advanced fullbacks if first pressing wave is broken",
            ],
            rest_defense_risk="Aggressive defensive line height leaves space behind center-backs vulnerable to lofted direct diagonals.",
            key_vulnerabilities=[
                "Direct switch of play bypasses the entire ball-near pressing net",
                "Underloaded weak-side allows opponent winger 1v1 transition if switch succeeds",
            ],
        )

        # 7. Opposition Responses
        opposition = OppositionResponses(
            recommended_counters=[
                "Execute an immediate diagonal switch to the unpressured weak-side winger",
                "Use a third-man wall pass via dropping central midfielder to escape sideline confinement",
            ],
            switch_potential="High feasibility if ball carrier can buy 1.5 seconds to angle body across pitch.",
            third_man_runs="Striker or opposite attacking midfielder dropping into Zone 14 creates an up-back-and-through release.",
        )

        # 8. Fan Watch Points
        fan_points = FanWatchPoints(
            what_to_watch_next=f"Watch whether {bc_name} is forced into a turnover by {pp_name}'s angle of approach, or manages to release the ball backward.",
            key_duel_to_follow=f"{pp_name} vs {bc_name} at the touchline boundary.",
            tactical_takeaway="A great press doesn't just chase the ball—it uses the sideline as an extra defender to take away half the pitch.",
        )

        # 9. Confidence and Limitations
        conf_limitations = ConfidenceAndLimitations(
            confidence_score=validation_data.get("confidence_score", 0.85),
            confidence_level=validation_data.get("confidence_level", "High"),
            data_sufficiency="Sufficient" if validation_data.get("is_sufficient", True) else "Limited context",
            limitations=validation_data.get("limitations", []),
        )

        return FullTacticalAnalysisReport(
            situation_overview=sit_overview,
            pressing_strategy=press_strategy,
            pressing_triggers=triggers,
            passing_lane_coverage=lane_coverage,
            tactical_advantages=tactical_adv,
            exposed_spaces=exposed,
            opposition_responses=opposition,
            fan_watch_points=fan_points,
            confidence_and_limitations=conf_limitations,
            supporting_sources=citations,
        )

    def _build_follow_up_fallback(
        self,
        question: str,
        scenario_data: Dict[str, Any],
    ) -> Tuple[str, List[str], List[str]]:
        """Generates grounded fallback answer for contextual follow-up inquiries."""
        att = scenario_data.get("attacking_team", {})
        df = scenario_data.get("defending_team", {})
        def_players = df.get("players", [])

        names = [f"#{p.get('number')} {p.get('name')}" for p in def_players[:3]]

        answer = (
            f"Addressing your follow-up inquiry regarding '{question}': In this setup, "
            f"{df.get('name', 'the defending team')} relies heavily on disciplined horizontal shifts. "
            f"If the ball carrier attempts to bypass the primary pressure line, the ball-near midfielders "
            f"must immediately drop and collapse inward to protect Zone 14. "
            f"This prevents vertical line-breaking passes and maintains the integrity of the pressing trap."
        )

        tactics = ["Cover Shadows", "Zone 14 Protection", "Compactness Shift", "Pressing Traps"]
        return answer, names, tactics
