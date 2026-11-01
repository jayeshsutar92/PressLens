import { type FC } from 'react'
import { Activity, ArrowRight, Compass, Shield, Users } from 'lucide-react'
import type { SpatialMetrics } from '../../types/analysis.ts'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '../common/index.ts'

export interface SpatialMetricsCardProps {
  metrics?: SpatialMetrics
}

export const SpatialMetricsCard: FC<SpatialMetricsCardProps> = ({ metrics }) => {
  if (!metrics) return null

  const {
    ball_carrier,
    primary_presser,
    supporting_pressers,
    pressing_funnel,
    compactness,
    passing_lane_summary,
  } = metrics

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Activity size={18} color="var(--color-tactical)" />
          Deterministic Spatial Dynamics
        </CardTitle>
        <Badge variant="tactical">Python Geometry Tools</Badge>
      </CardHeader>
      <CardContent>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {/* Primary Pressure */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
              <Users size={14} color="#f43f5e" />
              PRIMARY PRESSER
            </div>
            {primary_presser ? (
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                  #{primary_presser.number} {primary_presser.name} ({primary_presser.role})
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Distance to carrier: <strong style={{ color: '#f43f5e' }}>{primary_presser.distance_to_ball}m</strong>
                </div>
                {supporting_pressers && supporting_pressers.length > 0 && (
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    + {supporting_pressers.length} supporting pressers in &le;15m
                  </div>
                )}
              </div>
            ) : (
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>None identified</span>
            )}
          </div>

          {/* Ball Carrier */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
              <Compass size={14} color="#38bdf8" />
              BALL CARRIER
            </div>
            {ball_carrier ? (
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                  #{ball_carrier.number} {ball_carrier.name} ({ball_carrier.role})
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Pos: x:{ball_carrier.coordinates.x.toFixed(1)}m, y:{ball_carrier.coordinates.y.toFixed(1)}m
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Distance to ball: {ball_carrier.distance_to_ball}m
                </div>
              </div>
            ) : (
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>In dispute / loose ball</span>
            )}
          </div>

          {/* Funneling & Vector */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
              <ArrowRight size={14} color="#fb923c" />
              PRESSING FUNNEL
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', textTransform: 'capitalize' }}>
              {pressing_funnel?.replace('_', ' ') || 'Neutral Vector'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {pressing_funnel === 'touchline_lock'
                ? 'Sideline acting as extra defender'
                : pressing_funnel === 'flank_funneling'
                  ? 'Steering play towards wide touchline'
                  : 'Central density forcing lateral resets'}
            </div>
          </div>

          {/* Compactness & Block */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
              <Shield size={14} color="var(--color-pitch)" />
              DEFENSIVE COMPACTNESS
            </div>
            {compactness ? (
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                  {compactness.vertical_block_length_meters}m length &times; {compactness.horizontal_block_width_meters}m width
                </div>
                <div style={{ fontSize: '0.75rem', color: compactness.is_compact ? 'var(--color-pitch-light)' : '#f59e0b', marginTop: '2px' }}>
                  {compactness.is_compact ? 'Highly compact block (&le;35m)' : 'Stretched defensive block (>35m)'}
                </div>
              </div>
            ) : (
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>N/A</span>
            )}
          </div>
        </div>

        {/* Passing Lane Summary Breakdown */}
        {passing_lane_summary && (
          <div
            style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '0.8125rem',
            }}
          >
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              Passing Lanes ({passing_lane_summary.total_outlets} available outfield outlets):
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Badge variant="pitch">
                {passing_lane_summary.open} Open Escape Routes
              </Badge>
              <Badge variant="warning">
                {passing_lane_summary.contested} Contested Avenues
              </Badge>
              <Badge variant="danger">
                {passing_lane_summary.blocked_by_cover_shadow} Blocked by Cover Shadow
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
