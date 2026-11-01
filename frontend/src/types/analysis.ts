export interface SourceCitation {
  document_title: string
  topic: string
  author?: string
  publication?: string
  relevance_score: number
}

export interface SituationOverview {
  match_phase: string
  tactical_situation: string
  attacking_team_setup: string
  defending_team_setup: string
  ball_location_summary: string
  summary: string
}

export interface PressingStrategy {
  intensity: string
  primary_objective: string
  pressing_direction: string
  coordination_scheme: string
}

export interface PressingTriggers {
  visual_triggers: string[]
  tactical_traps: string[]
  primary_trigger_player?: string
}

export interface PassingLaneCoverage {
  cover_shadows_active: string[]
  blocked_options: string[]
  contested_options: string[]
  open_escape_routes: string[]
}

export interface TacticalAdvantages {
  compactness_advantage: string
  turnover_potential: string
  key_advantages: string[]
}

export interface ExposedSpaces {
  exposed_zones: string[]
  rest_defense_risk: string
  key_vulnerabilities: string[]
}

export interface OppositionResponses {
  recommended_counters: string[]
  switch_potential: string
  third_man_runs?: string
}

export interface FanWatchPoints {
  what_to_watch_next: string
  key_duel_to_follow: string
  tactical_takeaway: string
}

export interface ConfidenceAndLimitations {
  confidence_score: number
  confidence_level: string
  data_sufficiency: string
  limitations: string[]
}

export interface FullTacticalAnalysisReport {
  situation_overview: SituationOverview
  pressing_strategy: PressingStrategy
  pressing_triggers: PressingTriggers
  passing_lane_coverage: PassingLaneCoverage
  tactical_advantages: TacticalAdvantages
  exposed_spaces: ExposedSpaces
  opposition_responses: OppositionResponses
  fan_watch_points: FanWatchPoints
  confidence_and_limitations: ConfidenceAndLimitations
  supporting_sources: SourceCitation[]
}

export interface AnalysisCreateRequest {
  scenario_id: string
  user_query?: string
  focus_areas?: string[]
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  msg_metadata?: Record<string, unknown>
  created_at: string
}

export interface BallCarrierMetric {
  name?: string
  number?: number
  role?: string
  coordinates: { x: number; y: number }
  distance_to_ball: number
}

export interface PresserMetric {
  id?: string
  name: string
  number: number
  role: string
  position: { x: number; y: number }
  distance_to_ball: number
}

export interface PassingLaneMetric {
  target_player: string
  target_zone: string
  lane_distance_meters: number
  status: 'blocked_by_cover_shadow' | 'contested' | 'open' | string
  cover_shadow_defenders: string[]
  nearest_defender_distance: number
}

export interface CompactnessMetric {
  vertical_block_length_meters: number
  horizontal_block_width_meters: number
  is_compact: boolean
}

export interface SpatialMetrics {
  ball_carrier?: BallCarrierMetric
  primary_presser?: PresserMetric
  supporting_pressers?: PresserMetric[]
  pressing_funnel?: 'touchline_lock' | 'flank_funneling' | 'central_compression' | 'neutral' | string
  pressing_vector?: { dx: number; dy: number }
  passing_lanes?: PassingLaneMetric[]
  passing_lane_summary?: {
    total_outlets: number
    blocked_by_cover_shadow: number
    contested: number
    open: number
  }
  compactness?: CompactnessMetric
  open_options?: string[]
}

export interface Analysis {
  id: string
  scenario_id: string
  scenario_title: string
  status: 'completed' | 'pending' | 'failed' | string
  tactical_summary?: string
  pressing_intensity?: string
  analysis?: FullTacticalAnalysisReport
  spatial_metrics?: SpatialMetrics
  tools_executed?: string[]
  created_at: string
  updated_at: string
}

export interface AnalysisDetail extends Analysis {
  messages: ConversationMessage[]
}

export interface AnalysisStatus {
  id: string
  scenario_id: string
  status: string
  created_at: string
  updated_at: string
  error_message?: string
}

export interface AnalysisFollowUpRequest {
  question: string
}

export interface AnalysisFollowUpResponse {
  analysis_id: string
  question: string
  answer: string
  relevant_players_mentioned: string[]
  clarified_tactics: string[]
  sources_cited: SourceCitation[]
  created_at: string
}
