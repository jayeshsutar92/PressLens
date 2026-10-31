import json
from typing import Any, Dict, List, Optional


SYSTEM_TACTICAL_ANALYST = (
    "You are PressLens Tactical Agent, an expert football tactical analyst and pressing systems specialist. "
    "Your objective is to deliver precise, deeply grounded, context-aware analysis of football pressing situations, "
    "defensive transitions, cover shadows, and spatial geometry.\n\n"
    "MANDATORY ANALYSIS RULES:\n"
    "1. Strict Tactical Grounding: Anchor tactical points in established football literature and retrieved theory. Never fabricate tactical concepts.\n"
    "2. Deterministic Grounding: Use the deterministic spatial calculations provided (exact distances, pressing vectors, and identified cover shadows). Do not invent coordinates or player positions.\n"
    "3. Anti-Hallucination & Uncertainty: If context validation flags missing data or limitations, communicate uncertainty clearly in your 'confidence_and_limitations' section rather than making confident unsupported claims.\n"
    "4. Fan Accessibility with Tactical Precision: Your explanations must be clear and intuitive to an ordinary football fan, while preserving professional analytical depth.\n"
    "5. JSON Schema Output: You must respond ONLY with a valid JSON object matching the requested schema.\n"
)


def build_analysis_prompt(
    user_query: Optional[str],
    scenario_info: Dict[str, Any],
    spatial_info: Dict[str, Any],
    validation_info: Dict[str, Any],
    knowledge_chunks: List[Dict[str, Any]],
) -> List[Dict[str, str]]:
    """Builds the complete message payload for the 10-section tactical analysis."""
    sections = []

    # 1. Observed Scenario Context
    sections.append("### OBSERVED MATCH SCENARIO:")
    sections.append(f"Title: {scenario_info.get('title')}")
    sections.append(f"Phase: {scenario_info.get('match_phase')} | Situation: {scenario_info.get('tactical_situation')}")
    att = scenario_info.get("attacking_team", {})
    df = scenario_info.get("defending_team", {})
    sections.append(f"Attacking Team: {att.get('name')} ({att.get('formation')}, {att.get('player_count')} players)")
    sections.append(f"Defending Team: {df.get('name')} ({df.get('formation')}, {df.get('player_count')} players)")
    ball = scenario_info.get("ball_position", {})
    sections.append(f"Ball Position: Zone '{ball.get('zone')}' at x={ball.get('x')}, y={ball.get('y')}")

    # 2. Deterministic Spatial & Relationship Metrics
    sections.append("\n### DETERMINISTIC SPATIAL RELATIONSHIPS:")
    bc = spatial_info.get("ball_carrier", {})
    sections.append(f"- Ball Carrier: #{bc.get('number')} {bc.get('name')} ({bc.get('role')}) at coordinates ({bc.get('coordinates', {}).get('x')}, {bc.get('coordinates', {}).get('y')})")
    pp = spatial_info.get("primary_presser") or {}
    sections.append(f"- Primary Presser: #{pp.get('number')} {pp.get('name')} ({pp.get('role')}) - Distance to ball: {pp.get('distance_to_ball')} meters")
    sections.append(f"- Pressing Direction / Funnel: {spatial_info.get('pressing_funnel')}")
    comp = spatial_info.get("compactness", {})
    sections.append(f"- Defending Block Compactness: {comp.get('vertical_block_length_meters')}m vertical length x {comp.get('horizontal_block_width_meters')}m horizontal width (Compact: {comp.get('is_compact')})")

    # Passing lanes and cover shadows
    lanes = spatial_info.get("passing_lanes", [])
    if lanes:
        sections.append("- Passing Lane Evaluation:")
        for lane in lanes[:6]:
            shadows = ", ".join(lane.get("cover_shadow_defenders", [])) or "None"
            sections.append(
                f"  * To {lane.get('target_player')}: Status={lane.get('status')} | "
                f"Dist={lane.get('lane_distance_meters')}m | Cover Shadow Cast By: {shadows}"
            )

    open_opts = spatial_info.get("open_options", [])
    if open_opts:
        sections.append(f"- Open Options: {', '.join(open_opts)}")

    # 3. Validation & Limitations
    sections.append("\n### DATA VALIDATION & SUFFICIENCY:")
    sections.append(f"- Data Sufficiency: {'Sufficient' if validation_info.get('is_sufficient') else 'Limited'}")
    sections.append(f"- Confidence Level: {validation_info.get('confidence_level')} ({validation_info.get('confidence_score')})")
    limitations = validation_info.get("limitations", [])
    if limitations:
        sections.append("- Identified Limitations / Missing Elements:")
        for lim in limitations:
            sections.append(f"  * {lim}")

    # 4. Retrieved Tactical Knowledge
    sections.append("\n### RETRIEVED THEORETICAL TACTICAL KNOWLEDGE:")
    if knowledge_chunks:
        for idx, chunk in enumerate(knowledge_chunks, 1):
            sections.append(
                f"[{idx}] Source: {chunk.get('title')} (Topic: {chunk.get('topic')})\n"
                f"{chunk.get('content')}\n"
            )
    else:
        sections.append("No specific literature chunk surpassed the similarity threshold. Rely on foundational pressing theory and state appropriate uncertainty.")

    # 5. User Inquiry
    sections.append("\n### USER INQUIRY:")
    query_text = user_query if user_query and user_query.strip() else "Provide a comprehensive tactical pressing breakdown of this scenario."
    sections.append(f"\"{query_text}\"")

    sections.append(
        "\nProvide your analysis formatted as a JSON object strictly conforming to the FullTacticalAnalysisReport schema:\n"
        "{\n"
        '  "situation_overview": { "match_phase": "...", "tactical_situation": "...", "attacking_team_setup": "...", "defending_team_setup": "...", "ball_location_summary": "...", "summary": "..." },\n'
        '  "pressing_strategy": { "intensity": "...", "primary_objective": "...", "pressing_direction": "...", "coordination_scheme": "..." },\n'
        '  "pressing_triggers": { "visual_triggers": [...], "tactical_traps": [...], "primary_trigger_player": "..." },\n'
        '  "passing_lane_coverage": { "cover_shadows_active": [...], "blocked_options": [...], "contested_options": [...], "open_escape_routes": [...] },\n'
        '  "tactical_advantages": { "compactness_advantage": "...", "turnover_potential": "...", "key_advantages": [...] },\n'
        '  "exposed_spaces": { "exposed_zones": [...], "rest_defense_risk": "...", "key_vulnerabilities": [...] },\n'
        '  "opposition_responses": { "recommended_counters": [...], "switch_potential": "...", "third_man_runs": "..." },\n'
        '  "fan_watch_points": { "what_to_watch_next": "...", "key_duel_to_follow": "...", "tactical_takeaway": "..." },\n'
        '  "confidence_and_limitations": { "confidence_score": 0.0-1.0, "confidence_level": "...", "data_sufficiency": "...", "limitations": [...] },\n'
        '  "supporting_sources": [ ... ]\n'
        "}"
    )

    return [
        {"role": "system", "content": SYSTEM_TACTICAL_ANALYST},
        {"role": "user", "content": "\n".join(sections)},
    ]


def build_follow_up_prompt(
    follow_up_question: str,
    scenario_info: Dict[str, Any],
    initial_analysis_summary: str,
    conversation_history: List[Dict[str, str]],
    additional_knowledge: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, str]]:
    """Builds conversational prompt for contextual follow-up questions."""
    system_prompt = (
        "You are PressLens Tactical Agent continuing a tactical conversation with a user about a specific match scenario. "
        "Maintain deep context of the previously analyzed scenario, players, pressing direction, and tactical concepts. "
        "IMPORTANT RULES:\n"
        "1. Direct Answer: Answer the user's specific follow-up question directly and thoroughly without re-summarizing the entire initial analysis.\n"
        "2. Grounded references: Reference specific player names, roles, numbers, and pitch areas from the scenario.\n"
        "3. Tactical Accuracy: Distinguish between verified theoretical principles and scenario-specific observations.\n"
        "4. Output JSON: Respond with a JSON object with keys: 'answer', 'relevant_players_mentioned' (array), and 'clarified_tactics' (array).\n"
    )

    messages = [{"role": "system", "content": system_prompt}]

    # Provide initial scenario & analysis baseline as context
    initial_context = (
        f"### SCENARIO BASELINE: {scenario_info.get('title')} ({scenario_info.get('match_phase')})\n"
        f"Attacking: {scenario_info.get('attacking_team', {}).get('name')} | Defending: {scenario_info.get('defending_team', {}).get('name')}\n"
        f"Initial Analysis Summary: {initial_analysis_summary}\n"
    )
    messages.append({"role": "system", "content": initial_context})

    # Prior conversation history turns (pruned to last 6 for token efficiency)
    for msg in conversation_history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})

    # Additional retrieved knowledge if any
    if additional_knowledge:
        k_text = "\n### ADDITIONAL RETRIEVED TACTICAL KNOWLEDGE FOR FOLLOW-UP:\n"
        for chunk in additional_knowledge:
            k_text += f"- Source: {chunk.get('title')}: {chunk.get('content')}\n"
        messages.append({"role": "system", "content": k_text})

    # Current user follow-up inquiry
    messages.append({
        "role": "user",
        "content": (
            f"User Follow-up Question: \"{follow_up_question}\"\n\n"
            "Respond in JSON format with keys: answer (string), relevant_players_mentioned (list of player names/numbers), "
            "clarified_tactics (list of key tactical terms clarified)."
        ),
    })

    return messages
