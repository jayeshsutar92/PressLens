from typing import Any, Dict, List
from app.agent.tools.base import AgentTool, ToolResult


class ContextValidationTool(AgentTool):
    """Tool to validate context sufficiency and detect data limitations to prevent hallucination."""

    name: str = "context_validation"
    description: str = "Validates scenario completeness, coordinates, and identifies data limitations before analysis."

    async def execute(self, **kwargs: Any) -> ToolResult:
        """Validates scenario context.

        Expected kwargs:
            scenario_data (dict): Scenario dictionary.
            user_query (str, optional): User's prompt.
        """
        scenario = kwargs.get("scenario_data")
        if not scenario:
            return ToolResult(
                tool_name=self.name,
                success=False,
                summary="Validation failed: Scenario data is missing.",
                error_message="No scenario_data provided",
                data={
                    "is_sufficient": False,
                    "confidence_level": "Low",
                    "confidence_score": 0.20,
                    "limitations": ["Scenario object is completely absent."],
                },
            )

        missing_elements: List[str] = []
        limitations: List[str] = []

        # 1. Ball validation
        ball = scenario.get("ball_position")
        if not ball or ball.get("x") is None or ball.get("y") is None:
            missing_elements.append("ball_position")
            limitations.append("Exact ball position coordinates are missing; proximity calculations are estimated.")

        # 2. Player validation
        att_players = scenario.get("attacking_team", {}).get("players", [])
        def_players = scenario.get("defending_team", {}).get("players", [])

        if len(att_players) < 5:
            missing_elements.append("attacking_players_sparse")
            limitations.append(f"Attacking team has only {len(att_players)} players; full passing network cannot be verified.")
        if len(def_players) < 5:
            missing_elements.append("defending_players_sparse")
            limitations.append(f"Defending team has only {len(def_players)} players; full defensive block cannot be verified.")

        # Check coordinate validity
        invalid_coords = 0
        for p in att_players + def_players:
            pos = p.get("position", {})
            if pos.get("x") is None or pos.get("y") is None:
                invalid_coords += 1

        if invalid_coords > 0:
            missing_elements.append("player_coordinates_missing")
            limitations.append(f"{invalid_coords} players are missing exact pitch coordinates.")

        # 3. Match phase & context
        phase = scenario.get("match_phase")
        if not phase or phase == "unknown":
            limitations.append("Match phase is unspecified; tactical context must be inferred from geometry.")

        # Score confidence
        if not missing_elements and len(att_players) >= 10 and len(def_players) >= 10:
            confidence_level = "High"
            confidence_score = 0.95
            is_sufficient = True
        elif len(att_players) >= 5 and len(def_players) >= 5 and ball:
            confidence_level = "Medium"
            confidence_score = 0.75
            is_sufficient = True
            if not limitations:
                limitations.append("Reduced squad sample observed; analysis limited to active ball-near zone.")
        else:
            confidence_level = "Low"
            confidence_score = 0.40
            is_sufficient = False
            limitations.append("Significant data deficiencies detected. Explicit uncertainty communication required.")

        validation_data = {
            "is_sufficient": is_sufficient,
            "confidence_level": confidence_level,
            "confidence_score": confidence_score,
            "missing_elements": missing_elements,
            "limitations": limitations,
            "attacker_count": len(att_players),
            "defender_count": len(def_players),
        }

        summary = (
            f"Context sufficiency: {'Sufficient' if is_sufficient else 'Insufficient'} "
            f"({confidence_level} confidence, score={confidence_score}). "
            f"Observed: {len(att_players)} attackers, {len(def_players)} defenders. "
            f"Limitations flagged: {len(limitations)}."
        )

        return ToolResult(
            tool_name=self.name,
            success=True,
            data=validation_data,
            summary=summary,
        )
