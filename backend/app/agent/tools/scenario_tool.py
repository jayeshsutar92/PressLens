from typing import Any, Dict, List, Optional
from app.agent.tools.base import AgentTool, ToolResult
from app.core.logging import logger


class ScenarioInspectionTool(AgentTool):
    """Tool to inspect and interpret structured scenario information."""

    name: str = "scenario_inspection"
    description: str = "Inspects and structures player positions, formations, roles, and match context from a scenario."

    async def execute(self, **kwargs: Any) -> ToolResult:
        """Inspects scenario data.

        Expected kwargs:
            scenario_data (dict): Dictionary with attacking_team, defending_team, ball_position, match_phase, etc.
        """
        scenario = kwargs.get("scenario_data")
        if not scenario:
            return ToolResult(
                tool_name=self.name,
                success=False,
                summary="Failed: No scenario data provided for inspection.",
                error_message="Missing scenario_data parameter",
            )

        try:
            title = scenario.get("title", "Untitled Scenario")
            phase = scenario.get("match_phase", "unknown_phase")
            situation = scenario.get("tactical_situation", "Unspecified tactical situation")

            att_team = scenario.get("attacking_team", {})
            def_team = scenario.get("defending_team", {})
            ball = scenario.get("ball_position", {})
            match_ctx = scenario.get("match_context") or {}

            att_players: List[Dict[str, Any]] = att_team.get("players", [])
            def_players: List[Dict[str, Any]] = def_team.get("players", [])

            # Extract key roles
            att_roles = {p.get("role"): f"#{p.get('number')} {p.get('name')}" for p in att_players if p.get("role")}
            def_roles = {p.get("role"): f"#{p.get('number')} {p.get('name')}" for p in def_players if p.get("role")}

            structured_data = {
                "title": title,
                "match_phase": phase,
                "tactical_situation": situation,
                "attacking_team": {
                    "name": att_team.get("name", "Attacking Team"),
                    "formation": att_team.get("formation", "Unknown"),
                    "player_count": len(att_players),
                    "players": att_players,
                    "key_roles": att_roles,
                },
                "defending_team": {
                    "name": def_team.get("name", "Defending Team"),
                    "formation": def_team.get("formation", "Unknown"),
                    "player_count": len(def_players),
                    "players": def_players,
                    "key_roles": def_roles,
                },
                "ball_position": {
                    "x": ball.get("x"),
                    "y": ball.get("y"),
                    "zone": ball.get("zone", "Midfield"),
                },
                "match_context": match_ctx,
            }

            summary = (
                f"Scenario '{title}' ({phase}): {att_team.get('name', 'Attacking')} ({att_team.get('formation')}) vs "
                f"{def_team.get('name', 'Defending')} ({def_team.get('formation')}). "
                f"Ball at ({ball.get('x')}, {ball.get('y')}) in {ball.get('zone', 'pitch')}."
            )

            return ToolResult(
                tool_name=self.name,
                success=True,
                data=structured_data,
                summary=summary,
            )

        except Exception as err:
            logger.error("ScenarioInspectionTool failed: %s", str(err), exc_info=True)
            return ToolResult(
                tool_name=self.name,
                success=False,
                summary=f"Inspection failed: {str(err)}",
                error_message=str(err),
            )
