import { type FC } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Compass,
  Eye,
  Flame,
  HelpCircle,
  Lightbulb,
  Radio,
  Shield,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react'
import type { FullTacticalAnalysisReport, SpatialMetrics } from '../../types/analysis.ts'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '../common/index.ts'
import { KnowledgeSourcesCard } from './KnowledgeSourcesCard.tsx'
import { SpatialMetricsCard } from './SpatialMetricsCard.tsx'

export interface AnalysisReportViewProps {
  report?: FullTacticalAnalysisReport
  spatialMetrics?: SpatialMetrics
  scenarioTitle?: string
  scenarioDescription?: string
}

export const AnalysisReportView: FC<AnalysisReportViewProps> = ({
  report,
  spatialMetrics,
  scenarioTitle,
}) => {
  if (!report) {
    return (
      <Card>
        <CardContent style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>No structured tactical report available.</p>
        </CardContent>
      </Card>
    )
  }

  const {
    situation_overview,
    pressing_strategy,
    pressing_triggers,
    passing_lane_coverage,
    tactical_advantages,
    exposed_spaces,
    opposition_responses,
    fan_watch_points,
    confidence_and_limitations,
    supporting_sources,
  } = report

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Situation Overview */}
      {situation_overview && (
        <Card>
          <CardHeader>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Badge variant="tactical">
                  {situation_overview.match_phase?.replace('_', ' ').toUpperCase() || 'MATCH PHASE'}
                </Badge>
                <Badge variant="default">{situation_overview.tactical_situation}</Badge>
              </div>
              <CardTitle>
                <Compass size={20} color="var(--color-tactical)" />
                Situation Overview: {scenarioTitle || 'Tactical Setup'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  fontSize: '0.9375rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-canvas)',
                  borderLeft: '4px solid var(--color-tactical)',
                }}
              >
                {situation_overview.summary}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '12px',
                  fontSize: '0.8125rem',
                }}
              >
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-canvas)' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Attacking Structure:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{situation_overview.attacking_team_setup}</strong>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-canvas)' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Defending Block:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{situation_overview.defending_team_setup}</strong>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-canvas)' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Ball Location:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{situation_overview.ball_location_summary}</strong>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Deterministic Spatial Metrics (Computed by Python Geometry Tools) */}
      {spatialMetrics && <SpatialMetricsCard metrics={spatialMetrics} />}

      {/* 3. Pressing Strategy & Core Rationale */}
      {pressing_strategy && (
        <Card>
          <CardHeader>
            <CardTitle>
              <Flame size={20} color="#f43f5e" />
              Pressing Strategy & Coordination
            </CardTitle>
            <Badge variant="danger">{pressing_strategy.intensity} Intensity</Badge>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Primary Objective
                </h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {pressing_strategy.primary_objective}
                </p>
              </div>

              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Pressing Direction & Funneling
                </h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {pressing_strategy.pressing_direction}
                </p>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Coordination Scheme Across Units
                </h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {pressing_strategy.coordination_scheme}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Pressing Triggers & Traps */}
      {pressing_triggers && (
        <Card>
          <CardHeader>
            <CardTitle>
              <Zap size={20} color="#f59e0b" />
              Pressing Triggers & Tactical Traps
            </CardTitle>
            {pressing_triggers.primary_trigger_player && (
              <Badge variant="warning">
                Led by {pressing_triggers.primary_trigger_player}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Visual Cues */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Eye size={14} color="#f59e0b" />
                  Visual & Spatial Triggers
                </h4>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {pressing_triggers.visual_triggers.map((trigger, i) => (
                    <li key={i}>{trigger}</li>
                  ))}
                </ul>
              </div>

              {/* Tactical Traps */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Radio size={14} color="#ef4444" />
                  Baited Traps
                </h4>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {pressing_triggers.tactical_traps.map((trap, i) => (
                    <li key={i}>{trap}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Passing Lane Coverage & Cover Shadows */}
      {passing_lane_coverage && (
        <Card>
          <CardHeader>
            <CardTitle>
              <Shield size={20} color="var(--color-pitch)" />
              Passing Lane Coverage & Cover Shadows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {/* Active Cover Shadows */}
              <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-canvas)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#f43f5e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={14} />
                  Active Cover Shadows
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {passing_lane_coverage.cover_shadows_active.map((shadow, i) => (
                    <li key={i}>{shadow}</li>
                  ))}
                </ul>
              </div>

              {/* Directly Blocked Options */}
              <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-canvas)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#ef4444', marginBottom: '8px' }}>
                  Blocked Options
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {passing_lane_coverage.blocked_options.map((opt, i) => (
                    <li key={i}>{opt}</li>
                  ))}
                </ul>
              </div>

              {/* Contested Options */}
              <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-canvas)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#f59e0b', marginBottom: '8px' }}>
                  Contested Options (Secondary Pressure)
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {passing_lane_coverage.contested_options.map((opt, i) => (
                    <li key={i}>{opt}</li>
                  ))}
                </ul>
              </div>

              {/* Open Escape Routes */}
              <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-canvas)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-pitch-light)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} />
                  Open Escape Routes
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {passing_lane_coverage.open_escape_routes.map((opt, i) => (
                    <li key={i}>{opt}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 6. Tactical Advantages vs Exposed Spaces (Side-by-Side Comparison) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Tactical Advantages */}
        {tactical_advantages && (
          <Card style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <CardHeader>
              <CardTitle>
                <CheckCircle2 size={18} color="var(--color-pitch)" />
                Tactical Advantages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>
                    COMPACTNESS EDGE
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {tactical_advantages.compactness_advantage}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>
                    TURNOVER POTENTIAL
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {tactical_advantages.turnover_potential}
                  </div>
                </div>

                {tactical_advantages.key_advantages?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                      KEY ADVANTAGES
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {tactical_advantages.key_advantages.map((adv, i) => (
                        <li key={i}>{adv}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exposed Spaces and Vulnerabilities */}
        {exposed_spaces && (
          <Card style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <CardHeader>
              <CardTitle>
                <AlertTriangle size={18} color="#ef4444" />
                Exposed Spaces & Risks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>
                    REST-DEFENSE PROFILE
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {exposed_spaces.rest_defense_risk}
                  </div>
                </div>

                {exposed_spaces.exposed_zones?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                      EXPOSED PITCH ZONES
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {exposed_spaces.exposed_zones.map((zone, i) => (
                        <Badge key={i} variant="danger" size="sm">
                          {zone}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {exposed_spaces.key_vulnerabilities?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                      KEY VULNERABILITIES IF BROKEN
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {exposed_spaces.key_vulnerabilities.map((vuln, i) => (
                        <li key={i}>{vuln}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 7. Opposition Counter-Responses */}
      {opposition_responses && (
        <Card>
          <CardHeader>
            <CardTitle>
              <ArrowRight size={20} color="var(--color-tactical)" />
              Possible Opposition Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Recommended Counter-Mechanisms
                </h4>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {opposition_responses.recommended_counters.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Switch of Play Feasibility
                </h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {opposition_responses.switch_potential}
                </p>
                {opposition_responses.third_man_runs && (
                  <div style={{ marginTop: '8px' }}>
                    <h5 style={{ margin: '0 0 2px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Third-Man Runs:</h5>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {opposition_responses.third_man_runs}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 8. Fan Watch Points: What Ordinary Fans Should Watch Next */}
      {fan_watch_points && (
        <Card style={{ backgroundColor: 'rgba(59, 130, 246, 0.04)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
          <CardHeader>
            <CardTitle>
              <Lightbulb size={20} color="var(--color-tactical-light)" />
              What the Fan Should Watch Next
            </CardTitle>
            <Badge variant="tactical">Fan Insight</Badge>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-canvas)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  NEXT DECISIVE ACTION TO WATCH
                </span>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {fan_watch_points.what_to_watch_next}
                </p>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-canvas)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  KEY DUEL TO FOLLOW
                </span>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {fan_watch_points.key_duel_to_follow}
                </p>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-canvas)', gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Sparkles size={14} color="var(--color-pitch)" />
                  TACTICAL TAKEAWAY
                </span>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--color-pitch-light)', fontWeight: 500, lineHeight: 1.5 }}>
                  &ldquo;{fan_watch_points.tactical_takeaway}&rdquo;
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 9. Confidence and Limitations */}
      {confidence_and_limitations && (
        <Card>
          <CardHeader>
            <CardTitle>
              <HelpCircle size={18} color="var(--text-secondary)" />
              Confidence & Data Limitations
            </CardTitle>
            <Badge
              variant={
                confidence_and_limitations.confidence_level === 'High'
                  ? 'pitch'
                  : confidence_and_limitations.confidence_level === 'Medium'
                    ? 'warning'
                    : 'default'
              }
            >
              {Math.round(confidence_and_limitations.confidence_score * 100)}% Confidence ({confidence_and_limitations.confidence_level})
            </Badge>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <div>
                <strong>Data Sufficiency:</strong> {confidence_and_limitations.data_sufficiency}
              </div>
              {confidence_and_limitations.limitations?.length > 0 && (
                <div>
                  <strong style={{ color: 'var(--text-muted)' }}>Assumptions & Limitations:</strong>
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px', lineHeight: 1.5 }}>
                    {confidence_and_limitations.limitations.map((lim, i) => (
                      <li key={i}>{lim}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 10. Supporting Tactical Knowledge Sources */}
      {supporting_sources && supporting_sources.length > 0 && (
        <KnowledgeSourcesCard sources={supporting_sources} />
      )}
    </div>
  )
}

