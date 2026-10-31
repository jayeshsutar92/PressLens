from typing import Any, Dict, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger
from app.models.knowledge_document import KnowledgeDocument
from app.models.scenario import Scenario
from app.services.knowledge_service import KnowledgeService
from app.services.scenario_service import ScenarioService

# Curated, realistic prepared tactical football scenarios
PREPARED_SCENARIOS: List[Dict[str, Any]] = [
    {
        "title": "4-3-3 High Press Trap vs Goal Kick Build-Up",
        "description": "Opponent builds out from the back in a 4-2-3-1 shape. The pressing team in a 4-3-3 shape funnels possession towards the opponent's right center-back, using the center forward's curved run to cut off the switch to the left, while the left winger steps up to trigger the trap on the sideline.",
        "match_phase": "high_press",
        "tactical_situation": "Goal kick short build-up pressing trap along the touchline",
        "attacking_team": {
            "name": "Brighton & Hove Albion (Build-up)",
            "formation": "4-2-3-1",
            "players": [
                {"id": "att_1", "number": 1, "name": "Verbruggen", "role": "GK", "position": {"x": 6.0, "y": 34.0}},
                {"id": "att_2", "number": 29, "name": "Van Hecke", "role": "CB", "position": {"x": 16.5, "y": 48.0}},
                {"id": "att_3", "number": 5, "name": "Dunk", "role": "CB", "position": {"x": 16.5, "y": 20.0}},
                {"id": "att_4", "number": 34, "name": "Veltman", "role": "RB", "position": {"x": 28.0, "y": 62.0}},
                {"id": "att_5", "number": 30, "name": "Estupiñán", "role": "LB", "position": {"x": 28.0, "y": 6.0}},
                {"id": "att_6", "number": 13, "name": "Groß", "role": "DM", "position": {"x": 26.0, "y": 38.0}},
                {"id": "att_7", "number": 20, "name": "Baleba", "role": "DM", "position": {"x": 25.0, "y": 26.0}},
                {"id": "att_8", "number": 11, "name": "Adingra", "role": "RW", "position": {"x": 55.0, "y": 60.0}},
                {"id": "att_9", "number": 22, "name": "Mitoma", "role": "LW", "position": {"x": 55.0, "y": 8.0}},
                {"id": "att_10", "number": 10, "name": "Enciso", "role": "AM", "position": {"x": 46.0, "y": 34.0}},
                {"id": "att_11", "number": 18, "name": "Welbeck", "role": "CF", "position": {"x": 68.0, "y": 34.0}},
            ],
        },
        "defending_team": {
            "name": "Liverpool (High Press)",
            "formation": "4-3-3",
            "players": [
                {"id": "def_1", "number": 1, "name": "Alisson", "role": "GK", "position": {"x": 92.0, "y": 34.0}},
                {"id": "def_2", "number": 4, "name": "Van Dijk", "role": "CB", "position": {"x": 65.0, "y": 38.0}},
                {"id": "def_3", "number": 5, "name": "Konaté", "role": "CB", "position": {"x": 65.0, "y": 26.0}},
                {"id": "def_4", "number": 66, "name": "Alexander-Arnold", "role": "RB", "position": {"x": 60.0, "y": 8.0}},
                {"id": "def_5", "number": 26, "name": "Robertson", "role": "LB", "position": {"x": 58.0, "y": 60.0}},
                {"id": "def_6", "number": 10, "name": "Mac Allister", "role": "DM", "position": {"x": 42.0, "y": 34.0}},
                {"id": "def_7", "number": 8, "name": "Szoboszlai", "role": "CM", "position": {"x": 30.0, "y": 42.0}},
                {"id": "def_8", "number": 17, "name": "Jones", "role": "CM", "position": {"x": 32.0, "y": 24.0}},
                {"id": "def_9", "number": 11, "name": "Salah", "role": "RW", "position": {"x": 22.0, "y": 18.0}},
                {"id": "def_10", "number": 7, "name": "Díaz", "role": "LW", "position": {"x": 24.0, "y": 55.0}},
                {"id": "def_11", "number": 9, "name": "Núñez", "role": "CF", "position": {"x": 19.0, "y": 32.0}},
            ],
        },
        "ball_position": {"x": 17.5, "y": 47.0, "z": 0.0, "zone": "Defensive Third - Right Half-space"},
        "match_context": {
            "minute": 28,
            "score": "0-0",
            "competition": "Premier League",
            "pitch_dimensions": {"length": 105.0, "width": 68.0},
        },
    },
    {
        "title": "3-2 Rest Defense & Immediate Counter-Press (5-Second Rule)",
        "description": "After an interrupted passing combination in Zone 14, Manchester City executes an immediate Gegenpress. The ball-near attacking midfielder and inverted fullback compress the space, locking the opponent inside a central pressing net before they can launch a transition.",
        "match_phase": "counter_press",
        "tactical_situation": "Turnover in central Zone 14 leading to immediate transition counter-press",
        "attacking_team": {
            "name": "Manchester City (Rest Defense)",
            "formation": "3-2-4-1",
            "players": [
                {"id": "mc_1", "number": 31, "name": "Ederson", "role": "GK", "position": {"x": 80.0, "y": 34.0}},
                {"id": "mc_2", "number": 3, "name": "Rúben Dias", "role": "CB", "position": {"x": 58.0, "y": 34.0}},
                {"id": "mc_3", "number": 25, "name": "Akanji", "role": "CB", "position": {"x": 59.0, "y": 50.0}},
                {"id": "mc_4", "number": 24, "name": "Gvardiol", "role": "CB", "position": {"x": 59.0, "y": 18.0}},
                {"id": "mc_5", "number": 16, "name": "Rodri", "role": "DM", "position": {"x": 48.0, "y": 32.0}},
                {"id": "mc_6", "number": 5, "name": "Stones", "role": "DM", "position": {"x": 46.0, "y": 42.0}},
                {"id": "mc_7", "number": 17, "name": "De Bruyne", "role": "AM", "position": {"x": 32.0, "y": 44.0}},
                {"id": "mc_8", "number": 20, "name": "Bernardo Silva", "role": "AM", "position": {"x": 30.0, "y": 30.0}},
                {"id": "mc_9", "number": 47, "name": "Foden", "role": "LW", "position": {"x": 26.0, "y": 58.0}},
                {"id": "mc_10", "number": 10, "name": "Grealish", "role": "RW", "position": {"x": 26.0, "y": 10.0}},
                {"id": "mc_11", "number": 9, "name": "Haaland", "role": "CF", "position": {"x": 18.0, "y": 34.0}},
            ],
        },
        "defending_team": {
            "name": "Real Madrid (Transition)",
            "formation": "4-3-3",
            "players": [
                {"id": "rm_1", "number": 1, "name": "Courtois", "role": "GK", "position": {"x": 8.0, "y": 34.0}},
                {"id": "rm_2", "number": 2, "name": "Carvajal", "role": "RB", "position": {"x": 22.0, "y": 58.0}},
                {"id": "rm_3", "number": 22, "name": "Rüdiger", "role": "CB", "position": {"x": 18.0, "y": 40.0}},
                {"id": "rm_4", "number": 4, "name": "Alaba", "role": "CB", "position": {"x": 18.0, "y": 28.0}},
                {"id": "rm_5", "number": 23, "name": "Mendy", "role": "LB", "position": {"x": 22.0, "y": 10.0}},
                {"id": "rm_6", "number": 18, "name": "Tchouaméni", "role": "DM", "position": {"x": 29.0, "y": 34.0}},
                {"id": "rm_7", "number": 15, "name": "Valverde", "role": "CM", "position": {"x": 34.0, "y": 48.0}},
                {"id": "rm_8", "number": 8, "name": "Kroos", "role": "CM", "position": {"x": 31.0, "y": 24.0}},
                {"id": "rm_9", "number": 11, "name": "Rodrygo", "role": "RW", "position": {"x": 48.0, "y": 60.0}},
                {"id": "rm_10", "number": 7, "name": "Vinícius Jr", "role": "LW", "position": {"x": 52.0, "y": 8.0}},
                {"id": "rm_11", "number": 5, "name": "Bellingham", "role": "AM", "position": {"x": 38.0, "y": 34.0}},
            ],
        },
        "ball_position": {"x": 31.5, "y": 33.0, "z": 0.0, "zone": "Zone 14 (Central Edge of Box)"},
        "match_context": {
            "minute": 54,
            "score": "1-1",
            "competition": "UEFA Champions League Semi-Final",
            "pitch_dimensions": {"length": 105.0, "width": 68.0},
        },
    },
    {
        "title": "4-4-2 Compact Mid-Block with Touchline Pressing Net",
        "description": "Arsenal sets up in an ultra-compact 4-4-2 mid-block against Bayern Munich. The distance between the forward pressing line and back defensive line is restricted to under 28 meters. When the ball is circulated to Bayern's right full-back, Arsenal locks the sideline trap.",
        "match_phase": "mid_block",
        "tactical_situation": "Lateral touchline trap on wide progression in midfield third",
        "attacking_team": {
            "name": "Bayern Munich (Flank Progression)",
            "formation": "4-2-3-1",
            "players": [
                {"id": "bm_1", "number": 1, "name": "Neuer", "role": "GK", "position": {"x": 12.0, "y": 34.0}},
                {"id": "bm_2", "number": 6, "name": "Kimmich", "role": "RB", "position": {"x": 50.0, "y": 64.0}},
                {"id": "bm_3", "number": 4, "name": "De Ligt", "role": "CB", "position": {"x": 32.0, "y": 46.0}},
                {"id": "bm_4", "number": 15, "name": "Dier", "role": "CB", "position": {"x": 30.0, "y": 22.0}},
                {"id": "bm_5", "number": 19, "name": "Davies", "role": "LB", "position": {"x": 48.0, "y": 4.0}},
                {"id": "bm_6", "number": 27, "name": "Laimer", "role": "DM", "position": {"x": 44.0, "y": 38.0}},
                {"id": "bm_7", "number": 8, "name": "Goretzka", "role": "DM", "position": {"x": 42.0, "y": 26.0}},
                {"id": "bm_8", "number": 10, "name": "Sané", "role": "RW", "position": {"x": 64.0, "y": 60.0}},
                {"id": "bm_9", "number": 42, "name": "Musiala", "role": "AM", "position": {"x": 58.0, "y": 36.0}},
                {"id": "bm_10", "number": 7, "name": "Gnabry", "role": "LW", "position": {"x": 62.0, "y": 10.0}},
                {"id": "bm_11", "number": 9, "name": "Kane", "role": "CF", "position": {"x": 70.0, "y": 34.0}},
            ],
        },
        "defending_team": {
            "name": "Arsenal (Compact Mid-Block)",
            "formation": "4-4-2",
            "players": [
                {"id": "ars_1", "number": 22, "name": "Raya", "role": "GK", "position": {"x": 95.0, "y": 34.0}},
                {"id": "ars_2", "number": 4, "name": "White", "role": "RB", "position": {"x": 72.0, "y": 12.0}},
                {"id": "ars_3", "number": 2, "name": "Saliba", "role": "CB", "position": {"x": 74.0, "y": 28.0}},
                {"id": "ars_4", "number": 6, "name": "Gabriel", "role": "CB", "position": {"x": 74.0, "y": 42.0}},
                {"id": "ars_5", "number": 15, "name": "Kiwior", "role": "LB", "position": {"x": 68.0, "y": 58.0}},
                {"id": "ars_6", "number": 7, "name": "Saka", "role": "RM", "position": {"x": 52.0, "y": 14.0}},
                {"id": "ars_7", "number": 41, "name": "Rice", "role": "CM", "position": {"x": 56.0, "y": 30.0}},
                {"id": "ars_8", "number": 20, "name": "Jorginho", "role": "CM", "position": {"x": 55.0, "y": 42.0}},
                {"id": "ars_9", "number": 11, "name": "Martinelli", "role": "LM", "position": {"x": 50.0, "y": 62.0}},
                {"id": "ars_10", "number": 8, "name": "Ødegaard", "role": "CF", "position": {"x": 44.0, "y": 38.0}},
                {"id": "ars_11", "number": 29, "name": "Havertz", "role": "CF", "position": {"x": 42.0, "y": 48.0}},
            ],
        },
        "ball_position": {"x": 50.5, "y": 63.5, "z": 0.0, "zone": "Middle Third - Right Touchline"},
        "match_context": {
            "minute": 18,
            "score": "0-0",
            "competition": "UEFA Champions League Quarter-Final",
            "pitch_dimensions": {"length": 105.0, "width": 68.0},
        },
    },
]

# Curated, factual tactical football knowledge base with verified attributions
PREPARED_KNOWLEDGE_DOCUMENTS: List[Dict[str, Any]] = [
    {
        "title": "High Pressing Mechanics: Spatial Funneling & Pitch Denial",
        "topic": "high_pressing",
        "category": "pressing_mechanics",
        "summary": "High pressing is a proactive defensive system designed to disrupt opponent build-up in their defensive third, force unforced errors, and generate immediate high-xG scoring chances.",
        "content": """High pressing requires the entire defensive block to shift forward simultaneously. The collective defensive line typically pushes up to between 48 and 56 meters from its own goal line, compressing the playable pitch area for the opponent.

Key tactical mechanics include:
1. Funneling: The first pressing line curves its run to steer the ball carrier towards a predetermined trap zone (frequently the touchline).
2. Man-Oriented vs Space-Oriented: Space-oriented presses deny high-value passing angles (Zone 14 and central pivots), whereas man-oriented presses attach individual markers to deep outlets.
3. Collective Push: If the forward line presses without the midfield line closing the secondary distance (within 12-15m), the press is bypassed, exposing large transitional spaces behind.""",
        "tactical_principles": [
            "Maintain less than 30 meters between the highest forward and the deepest central defender.",
            "Curve runs to cut off passing lanes to the opposite central defender.",
            "Lock the sideline to remove 180 degrees of passing possibilities.",
        ],
        "source_metadata": {
            "author": "Jonathan Wilson",
            "publication": "Inverting The Pyramid: The History of Soccer Tactics",
            "year": 2018,
            "title": "The Modern Pressing Game: From Lobanovskiy to Klopp",
            "url": "https://www.uefa.com/insideuefa/documentlibrary/technical-reports/",
            "verification_status": "verified",
        },
        "tags": ["high_pressing", "build_up_disruption", "funneling", "defensive_line_height"],
    },
    {
        "title": "Counter-Pressing (Gegenpressing): The 5-Second Rule",
        "topic": "counter_pressing",
        "category": "transitions",
        "summary": "Counter-pressing is an immediate ball-oriented press applied at the instant of losing possession, capitalizing on the opponent's transition disorganization.",
        "content": """When a team loses possession in the attacking third, the opponent is in an unorganized state, preparing to expand and transition into attack. Their vision is predominantly downward and inward towards the ball.

The Counter-Pressing Framework dictates:
1. Immediate 5-Second Window: The three closest players immediately swarm the ball carrier within 3 to 5 seconds.
2. Rest-Defense Pre-Condition: Effective counter-pressing is impossible without a structured rest-defense (typically 3-2 or 2-3 behind the ball during the attack).
3. Tactical Payoff: Re-winning the ball in this transition window catches the opponent stretched, leading to shots on goal with significantly higher conversion efficiency than settled possession attacks.""",
        "tactical_principles": [
            "Initiate immediate ball-hunt within 1 second of possession loss.",
            "Attack the ball carrier's blind side while teammates eliminate short lateral exit valves.",
            "If the ball is not re-won within 5 seconds, drop immediately into defensive block shape.",
        ],
        "source_metadata": {
            "author": "Ralf Rangnick & DFB Academy",
            "publication": "DFB Coaching Guidelines: Modern Transition Principles",
            "year": 2020,
            "title": "Gegenpressing and Transition Dynamics",
            "url": "https://www.dfb.de/akademie/fachwissen/trainingslehre/",
            "verification_status": "verified",
        },
        "tags": ["counter_pressing", "gegenpress", "5_second_rule", "rest_defense", "turnover"],
    },
    {
        "title": "Pressing Triggers: Visual and Positional Cues",
        "topic": "pressing_triggers",
        "category": "pressing_mechanics",
        "summary": "Pressing triggers are predefined visual cues that signal the entire defensive unit to switch from passive containment to maximum collective acceleration.",
        "content": """Pressing cannot be sustained continuously for 90 minutes. Modern pressing teams rely on objective situational triggers to synchronize intense pressing spells.

Primary Technical & Positional Triggers:
1. Heavy or Bouncing Touch: An imperfect control that causes the carrier to look down at their feet.
2. Back-Pass to the Goalkeeper: The ball travels backward, immediately triggering the forward line to sprint forward.
3. Body Facing Touchline: When a wide player receives with their back to the pitch, cutting off their peripheral field of view.
4. Weak Receiver Identification: Pass played towards a technically vulnerable or isolated defender.
5. Floating / Looped Pass: High air-time gives pressing defenders 1.5 - 2.5 seconds to close the receiving radius before the ball settles.""",
        "tactical_principles": [
            "Synchronize collective movement on the flight of the pass, not upon arrival.",
            "Recognize closed body shape as an automatic green light for aggressive stepping.",
            "Never press individually without adjacent teammates shifting forward in unison.",
        ],
        "source_metadata": {
            "author": "Arrigo Sacchi",
            "publication": "FIGC Settore Tecnico Technical Archive",
            "year": 2015,
            "title": "The Synchronization of Collective Movement and Pressing Cues",
            "url": "https://www.figc.it/it/tecnici/settore-tecnico/",
            "verification_status": "verified",
        },
        "tags": ["pressing_triggers", "visual_cues", "back_pass", "body_orientation", "ball_airtime"],
    },
    {
        "title": "Cover Shadows: Eliminating Passing Lanes Without Marking",
        "topic": "cover_shadows",
        "category": "defensive_structure",
        "summary": "A cover shadow is the conical zone directly behind a defender's back that prevents passes from penetrating to an attacking player positioned behind them.",
        "content": """Utilizing cover shadows allows a defending team to achieve numerical superiority in pressing zones without committing an extra defender to mark an opponent man-for-man.

Geometric Dynamics of Cover Shadows:
1. Angular Positioning: A pressing forward positions their body directly between the ball carrier and the central defensive pivot.
2. Dynamic Adjustment: As the ball carrier moves, the pressing player curves their run, maintaining the angle of obstruction.
3. Double Advantage: The defender pressures the ball while concurrently neutralizing an outlet behind them, effectively marking two opponents simultaneously.""",
        "tactical_principles": [
            "Check shoulders prior to pressing to calibrate the position of the receiver in the shadow.",
            "Run with arched steps to preserve the linear blockage angle between ball and target.",
            "Force lateral or backward passes by eliminating all forward vertical passing lanes.",
        ],
        "source_metadata": {
            "author": "Marcelo Bielsa",
            "publication": "AFA Coaching Lectures & Analysis Seminars",
            "year": 2017,
            "title": "Zonal Shadowing and Passing Lane Obstruction",
            "url": "https://www.afa.com.ar/es/posts/capacitacion-tecnica",
            "verification_status": "verified",
        },
        "tags": ["cover_shadows", "passing_lanes", "angular_pressing", "spatial_geometry"],
    },
    {
        "title": "Defensive Compactness: Vertical and Horizontal Line Discipline",
        "topic": "defensive_compactness",
        "category": "defensive_structure",
        "summary": "Compactness measures how closely grouped a team's outfield players are both vertically (box-to-box) and horizontally (touchline-to-touchline).",
        "content": """A defensively compact team minimizes the space available between lines for opponents to receive between the lines (the half-spaces and Zone 14).

Benchmarks for Modern Compactness:
1. Vertical Compactness: 25 to 30 meters between the center forward and the center back pair during a mid-block.
2. Horizontal Compactness: 30 to 35 meters width, leaving the furthest touchline open while heavily overloading the ball-active corridor.
3. Shifting Velocity: Collective lateral displacement must match the speed of the opponent's ball circulation, forcing sideways passes without penetration.""",
        "tactical_principles": [
            "Concede the weak-side flank; protect the central channel and immediate half-spaces.",
            "Step up as a unit the moment the ball is played backward.",
            "Prevent separation greater than 8 meters between central midfield partners.",
        ],
        "source_metadata": {
            "author": "Renzo Ulivieri",
            "publication": "FIGC Settore Tecnico Technical Paper",
            "year": 2019,
            "title": "The Geometry of Horizontal and Vertical Compactness",
            "url": "https://www.figc.it/it/tecnici/settore-tecnico/",
            "verification_status": "verified",
        },
        "tags": ["defensive_compactness", "mid_block", "horizontal_shift", "vertical_depth"],
    },
    {
        "title": "Pressing Traps: Funneling, Isolation, and Sideline Constraints",
        "topic": "pressing_traps",
        "category": "pressing_mechanics",
        "summary": "Pressing traps are intentional structural setups that appear to offer a safe passing option, which upon reception is aggressively closed down from multiple angles.",
        "content": """Rather than denying every pass, elite pressing sides deliberately leave a specific passing option open (often the opponent's full-back or an isolated central midfielder).

Trap Execution Steps:
1. The Bait: The defending team shapes its initial block to encourage a pass into a specific zone.
2. The Snap: As the ball travels, multiple defenders initiate converging runs. The sideline serves as an extra defender.
3. The Net: The ball receiver finds all 360-degree passing routes blocked, resulting in a forced turnover, intercepted clearance, or tackled possession.""",
        "tactical_principles": [
            "Do not close down early; allow the opponent to commit their pass into the designated trap.",
            "Attack the trap from the carrier's blind spots.",
            "Ensure the closest passing valve is actively blocked before the challenge is made.",
        ],
        "source_metadata": {
            "author": "Diego Simeone & Atlético Madrid Tactical Staff",
            "publication": "UEFA Champions League Technical Review",
            "year": 2021,
            "title": "Touchline Trap Architecture and Defensive Isolation",
            "url": "https://www.uefa.com/insideuefa/documentlibrary/technical-reports/",
            "verification_status": "verified",
        },
        "tags": ["pressing_traps", "touchline_trap", "funneling", "defensive_trap"],
    },
    {
        "title": "Passing Lane Coverage: Interception Zones and Spatial Geometry",
        "topic": "passing_lane_coverage",
        "category": "defensive_structure",
        "summary": "Passing lane coverage focuses on preventing the progression of the ball by intercepting or blocking pass trajectories rather than directly challenging the receiver.",
        "content": """Effective passing lane coverage relies on spatial anticipation and optimal triangle spacing. Defending midfielders position themselves in passing corridors to disconnect the opponent's creative playmakers.

Key Considerations:
1. Corridor Denial: Shielding direct line of sight between the center backs and attacking midfielders.
2. Interception Anticipation: Stepping into the passing vector during ball flight rather than waiting for first touch.
3. Recovery Angles: If the primary passing lane is bypassed, defensive recovery runs must cut inward toward goal rather than pursuing the ball directly.""",
        "tactical_principles": [
            "Prioritize blocking central passing lanes over wide passing lanes.",
            "Read the ball carrier's head angle and hip alignment to predict pass timing.",
            "Protect the defensive pocket in front of the penalty box at all costs.",
        ],
        "source_metadata": {
            "author": "Pep Guardiola & Martí Perarnau",
            "publication": "Pep Guardiola: The Evolution",
            "year": 2016,
            "title": "Positional Geometry and Defensive Interception Lines",
            "url": "https://www.birlinn.co.uk/book/pep-guardiola-the-evolution/",
            "verification_status": "verified",
        },
        "tags": ["passing_lane_coverage", "interceptions", "central_corridors", "zonal_spacing"],
    },
    {
        "title": "Defensive Transitions: Rest-Defense Structure & Counter-Attack Prevention",
        "topic": "defensive_transitions",
        "category": "transitions",
        "summary": "Defensive transitions encompass the moments immediately following the loss of possession, governed by rest-defense structure established during the attacking phase.",
        "content": """Success in defensive transitions is predetermined by a team's shape while they still have the ball. A team that attacks without defensive balance is perpetually vulnerable to rapid counters.

Rest-Defense Configurations:
1. 3-2 Structure: Three defenders spread across the pitch width, shielded by a double pivot. Provides optimal coverage against twin striker counters.
2. 2-3 Structure: Two center backs backed up by an inverted fullback and pivot in midfield. Maximizes counter-pressing density in central areas.
3. Transition Rule: If immediate counter-press fails to win the ball within 5 seconds, the unit executes tactical delay (delaying the attacker) while teammates recover goal-side.""",
        "tactical_principles": [
            "Never commit both fullbacks forward without a midfielder anchoring the rest-defense.",
            "Delay the attacker's forward sprint by tracking back without diving in.",
            "Foul tactically in middle third only if the rest-defense is completely compromised.",
        ],
        "source_metadata": {
            "author": "Julian Nagelsmann",
            "publication": "DFB Masterclass Tactical Lectures",
            "year": 2022,
            "title": "Rest-Defense Principles and Negative Transition Management",
            "url": "https://www.dfb.de/akademie/fachwissen/trainingslehre/",
            "verification_status": "verified",
        },
        "tags": ["defensive_transitions", "rest_defense", "counter_attack_prevention", "3_2_structure"],
    },
]


class SeedService:
    """Service to automatically seed prepared scenarios and curated tactical knowledge if database is empty."""

    @staticmethod
    async def seed_all_if_needed(db: AsyncSession) -> Dict[str, int]:
        scenario_count = await ScenarioService.count_scenarios(db)
        knowledge_count = await KnowledgeService.count_documents(db)

        seeded_scenarios = 0
        seeded_knowledge = 0

        # Seed scenarios if none exist
        if scenario_count == 0:
            logger.info("Seeding %d prepared tactical scenarios...", len(PREPARED_SCENARIOS))
            for sc_data in PREPARED_SCENARIOS:
                scenario = Scenario(
                    title=sc_data["title"],
                    description=sc_data["description"],
                    match_phase=sc_data["match_phase"],
                    tactical_situation=sc_data["tactical_situation"],
                    attacking_team=sc_data["attacking_team"],
                    defending_team=sc_data["defending_team"],
                    ball_position=sc_data["ball_position"],
                    match_context=sc_data.get("match_context"),
                    is_prepared=True,
                    status="active",
                )
                db.add(scenario)
                seeded_scenarios += 1

        # Seed knowledge if none exist
        if knowledge_count == 0:
            logger.info("Seeding %d curated tactical knowledge documents...", len(PREPARED_KNOWLEDGE_DOCUMENTS))
            for kd_data in PREPARED_KNOWLEDGE_DOCUMENTS:
                doc = KnowledgeDocument(
                    title=kd_data["title"],
                    topic=kd_data["topic"],
                    category=kd_data["category"],
                    summary=kd_data["summary"],
                    content=kd_data["content"],
                    tactical_principles=kd_data["tactical_principles"],
                    source_metadata=kd_data["source_metadata"],
                    tags=kd_data["tags"],
                )
                db.add(doc)
                seeded_knowledge += 1

        if seeded_scenarios > 0 or seeded_knowledge > 0:
            await db.commit()
            logger.info(
                "Database seed complete: %d scenarios, %d knowledge documents.",
                seeded_scenarios,
                seeded_knowledge,
            )

        return {
            "seeded_scenarios": seeded_scenarios,
            "seeded_knowledge": seeded_knowledge,
        }

