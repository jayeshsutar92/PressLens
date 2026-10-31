import math
from typing import Any, Dict, List, Optional, Tuple
from app.agent.tools.base import AgentTool, ToolResult
from app.core.logging import logger


def _euclidean_dist(p1: Dict[str, float], p2: Dict[str, float]) -> float:
    """Calculates Euclidean distance between two 2D points."""
    return math.hypot(p1["x"] - p2["x"], p1["y"] - p2["y"])


def _point_to_segment_distance(
    px: float, py: float,
    x1: float, y1: float,
    x2: float, y2: float
) -> Tuple[float, float]:
    """Calculates the perpendicular distance from (px, py) to segment (x1, y1)-(x2, y2)
    and the projection scalar t in [0, 1].
    """
    dx = x2 - x1
    dy = y2 - y1
    seg_len_sq = dx * dx + dy * dy

    if seg_len_sq < 1e-6:
        # Segment is essentially a point
        return math.hypot(px - x1, py - y1), 0.0

    t = ((px - x1) * dx + (py - y1) * dy) / seg_len_sq
    t_clamped = max(0.0, min(1.0, t))
    proj_x = x1 + t_clamped * dx
    proj_y = y1 + t_clamped * dy

    dist = math.hypot(px - proj_x, py - proj_y)
    return dist, t


class TacticalRelationshipTool(AgentTool):
    """Tool to calculate deterministic spatial relationships, pressing vectors, and cover shadows."""

    name: str = "tactical_relationship_analysis"
    description: str = "Calculates exact player-to-ball distances, pressing vectors, passing lanes, cover shadows, and team compactness."

    async def execute(self, **kwargs: Any) -> ToolResult:
        """Executes spatial and geometric tactical analysis.

        Expected kwargs:
            scenario_data (dict): Scenario structure with attacking_team, defending_team, ball_position.
        """
        scenario = kwargs.get("scenario_data")
        if not scenario:
            return ToolResult(
                tool_name=self.name,
                success=False,
                summary="Failed: No scenario data provided.",
                error_message="Missing scenario_data",
            )

        try:
            ball = scenario.get("ball_position", {})
            bx = float(ball.get("x", 50.0))
            by = float(ball.get("y", 34.0))
            ball_pos = {"x": bx, "y": by}

            att_players: List[Dict[str, Any]] = scenario.get("attacking_team", {}).get("players", [])
            def_players: List[Dict[str, Any]] = scenario.get("defending_team", {}).get("players", [])

            if not att_players or not def_players:
                return ToolResult(
                    tool_name=self.name,
                    success=False,
                    summary="Insufficient players on pitch to compute tactical relationships.",
                    error_message="Player lists are empty or incomplete.",
                )

            # 1. Identify Ball Carrier
            att_distances = []
            for p in att_players:
                pos = p.get("position", {})
                px, py = float(pos.get("x", 0.0)), float(pos.get("y", 0.0))
                dist = _euclidean_dist({"x": px, "y": py}, ball_pos)
                att_distances.append((dist, p))

            att_distances.sort(key=lambda item: item[0])
            ball_carrier_dist, ball_carrier = att_distances[0]

            bc_pos = ball_carrier.get("position", {})
            bc_x, bc_y = float(bc_pos.get("x", bx)), float(bc_pos.get("y", by))

            # 2. Defending Pressure on Ball Carrier
            def_distances = []
            for d in def_players:
                pos = d.get("position", {})
                dx, dy = float(pos.get("x", 0.0)), float(pos.get("y", 0.0))
                dist = _euclidean_dist({"x": dx, "y": dy}, {"x": bc_x, "y": bc_y})
                def_distances.append({
                    "id": d.get("id"),
                    "name": d.get("name"),
                    "number": d.get("number"),
                    "role": d.get("role"),
                    "position": {"x": dx, "y": dy},
                    "distance_to_ball": round(dist, 1),
                })

            def_distances.sort(key=lambda d: d["distance_to_ball"])
            primary_presser = def_distances[0] if def_distances else None
            supporting_pressers = [d for d in def_distances[1:4] if d["distance_to_ball"] <= 15.0]

            # 3. Pressing Direction and Vector
            pressing_vector = None
            pressing_funnel = "neutral"
            if primary_presser:
                p_pos = primary_presser["position"]
                vx = bc_x - p_pos["x"]
                vy = bc_y - p_pos["y"]
                pressing_vector = {"dx": round(vx, 2), "dy": round(vy, 2)}

                # Determine touchline funneling vs central forcing
                if bc_y >= 50.0 or bc_y <= 18.0:
                    pressing_funnel = "touchline_lock"
                elif abs(vy) > abs(vx):
                    pressing_funnel = "flank_funneling"
                else:
                    pressing_funnel = "central_compression"

            # 4. Passing Lane Analysis & Cover Shadows
            # Check options for ball carrier among teammates
            passing_lanes: List[Dict[str, Any]] = []
            for _, teammate in att_distances[1:]:
                if teammate.get("role") == "GK":
                    continue

                t_pos = teammate.get("position", {})
                tx, ty = float(t_pos.get("x", 0.0)), float(t_pos.get("y", 0.0))
                lane_dist = _euclidean_dist({"x": bc_x, "y": bc_y}, {"x": tx, "y": ty})

                # Check which defenders intercept or cast cover shadows on this lane
                shadowing_defenders: List[Dict[str, Any]] = []
                for d in def_players:
                    d_pos = d.get("position", {})
                    dx, dy = float(d_pos.get("x", 0.0)), float(d_pos.get("y", 0.0))
                    perp_dist, t_val = _point_to_segment_distance(dx, dy, bc_x, bc_y, tx, ty)

                    # Shadow condition: defender is between carrier and receiver with small perpendicular offset
                    if 0.10 <= t_val <= 0.90 and perp_dist <= 3.0:
                        shadowing_defenders.append({
                            "name": d.get("name"),
                            "role": d.get("role"),
                            "shadow_distance": round(perp_dist, 2),
                        })

                # Receiver proximity to nearest defender
                dist_to_nearest_def = min(
                    _euclidean_dist({"x": tx, "y": ty}, {"x": d["position"]["x"], "y": d["position"]["y"]})
                    for d in def_distances
                )

                if shadowing_defenders:
                    status = "blocked_by_cover_shadow"
                elif dist_to_nearest_def <= 3.5:
                    status = "contested"
                else:
                    status = "open"

                passing_lanes.append({
                    "target_player": f"#{teammate.get('number')} {teammate.get('name')} ({teammate.get('role')})",
                    "target_zone": f"x={tx:.1f}, y={ty:.1f}",
                    "lane_distance_meters": round(lane_dist, 1),
                    "status": status,
                    "cover_shadow_defenders": [d["name"] for d in shadowing_defenders],
                    "nearest_defender_distance": round(dist_to_nearest_def, 1),
                })

            # 5. Team Compactness Metrics
            outfield_def = [d for d in def_players if d.get("role") != "GK"]
            if outfield_def:
                xs = [float(d["position"]["x"]) for d in outfield_def]
                ys = [float(d["position"]["y"]) for d in outfield_def]
                block_length = round(max(xs) - min(xs), 1)
                block_width = round(max(ys) - min(ys), 1)
            else:
                block_length = 0.0
                block_width = 0.0

            # 6. Exposed Spaces (Unmarked players & open zones)
            open_options = [lane for lane in passing_lanes if lane["status"] == "open"]
            blocked_count = sum(1 for lane in passing_lanes if lane["status"] == "blocked_by_cover_shadow")

            spatial_data = {
                "ball_carrier": {
                    "name": ball_carrier.get("name"),
                    "number": ball_carrier.get("number"),
                    "role": ball_carrier.get("role"),
                    "coordinates": {"x": bc_x, "y": bc_y},
                    "distance_to_ball": round(ball_carrier_dist, 2),
                },
                "primary_presser": primary_presser,
                "supporting_pressers": supporting_pressers,
                "pressing_funnel": pressing_funnel,
                "pressing_vector": pressing_vector,
                "passing_lanes": passing_lanes,
                "passing_lane_summary": {
                    "total_outlets": len(passing_lanes),
                    "blocked_by_cover_shadow": blocked_count,
                    "contested": sum(1 for lane in passing_lanes if lane["status"] == "contested"),
                    "open": len(open_options),
                },
                "compactness": {
                    "vertical_block_length_meters": block_length,
                    "horizontal_block_width_meters": block_width,
                    "is_compact": block_length <= 35.0,
                },
                "open_options": [o["target_player"] for o in open_options],
            }

            summary = (
                f"Ball carrier: #{ball_carrier.get('number')} {ball_carrier.get('name')}. "
                f"Primary presser: #{primary_presser['number']} {primary_presser['name']} ({primary_presser['distance_to_ball']}m). "
                f"Funneling: {pressing_funnel}. Compactness: {block_length}m length x {block_width}m width. "
                f"Outlets: {blocked_count} blocked by cover shadow, {len(open_options)} open."
            )

            return ToolResult(
                tool_name=self.name,
                success=True,
                data=spatial_data,
                summary=summary,
            )

        except Exception as err:
            logger.error("TacticalRelationshipTool failed: %s", str(err), exc_info=True)
            return ToolResult(
                tool_name=self.name,
                success=False,
                summary=f"Spatial analysis failed: {str(err)}",
                error_message=str(err),
            )
