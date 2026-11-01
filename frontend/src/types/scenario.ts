export interface PlayerPosition {
  x: number
  y: number
  z?: number
}

export interface Player {
  id: string
  number: number
  name: string
  role: string
  position: PlayerPosition
}

export interface TeamTacticalSetup {
  name: string
  formation: string
  players: Player[]
}

export interface BallPosition {
  x: number
  y: number
  z?: number
  zone?: string
}

export interface MatchContext {
  minute?: number
  score?: string
  competition?: string
  pitch_dimensions?: {
    length: number
    width: number
  }
}

export type MatchPhase =
  | 'high_press'
  | 'mid_block'
  | 'low_block'
  | 'counter_press'
  | 'defensive_transition'
  | string

export interface ScenarioSummary {
  id: string
  title: string
  match_phase: MatchPhase
  tactical_situation: string
  is_prepared: boolean
  status: string
  created_at: string
}

export interface Scenario extends ScenarioSummary {
  description?: string
  attacking_team: TeamTacticalSetup
  defending_team: TeamTacticalSetup
  ball_position: BallPosition
  match_context?: MatchContext
  updated_at: string
}

export interface ScenarioCreatePayload {
  title: string
  description?: string
  match_phase: MatchPhase
  tactical_situation: string
  attacking_team: TeamTacticalSetup
  defending_team: TeamTacticalSetup
  ball_position: BallPosition
  match_context?: MatchContext
}
