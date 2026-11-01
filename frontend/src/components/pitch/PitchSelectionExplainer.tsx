import { type FC } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  Crosshair,
  Flame,
  Shield,
  ShieldAlert,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import type { Player } from '../../types/scenario.ts'
import type { FullTacticalAnalysisReport, PassingLaneMetric, SpatialMetrics } from '../../types/analysis.ts'
import { getPitchZone } from '../../utils/zones.ts'
import { Badge, Button, Card, CardContent } from '../common/index.ts'

export interface PitchSelectionExplainerProps {
  selectedPlayer: Player | null
  selectedTeam: 'attacking' | 'defending' | null
  attackingTeamName?: string
  defendingTeamName?: string
  selectedLane: PassingLaneMetric | null
  selectedTrap: boolean
  selectedCompactness: boolean
  spatialMetrics?: SpatialMetrics
  report?: FullTacticalAnalysisReport
  onClearSelection: () => void
}

export const PitchSelectionExplainer: FC<PitchSelectionExplainerProps> = ({
  selectedPlayer,
  selectedTeam,
  attackingTeamName = 'Attacking Team',
  defendingTeamName = 'Defending Team',
  selectedLane,
  selectedTrap,
  selectedCompactness,
  spatialMetrics,
  report,
  onClearSelection,
}) => {
  // Case 1: Passing Lane Selected
  if (selectedLane) {
    const isBlocked = selectedLane.status === 'blocked_by_cover_shadow'
    const isContested = selectedLane.status === 'contested'
    const statusLabel = isBlocked ? 'Blocked by Cover Shadow' : isContested ? 'Contested Lane' : 'Open Escape Route'
    const badgeVariant = isBlocked ? 'danger' : isContested ? 'warning' : 'pitch'

    return (
      <Card style={{ borderLeft: `4px solid ${isBlocked ? 'var(--color-danger)' : isContested ? '#f59e0b' : 'var(--color-pitch)'}` }}>
        <CardContent style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <Badge variant={badgeVariant} icon={isBlocked ? <ShieldAlert size={12} /> : isContested ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}>
                  {statusLabel.toUpperCase()}
                </Badge>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Passing Distance: <strong>{selectedLane.lane_distance_meters.toFixed(1)}m</strong>
                </span>
              </div>

              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Pass to {selectedLane.target_player}
                </h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {isBlocked
                    ? `This pass is completely shut down. The defending presser's body angle creates a "cover shadow" that prevents the ball from reaching ${selectedLane.target_player}. Attempting this pass risks an immediate turnover.`
                    : isContested
                      ? `This is a risky pass. A defender is lurking just ${selectedLane.nearest_defender_distance.toFixed(1)}m away and will close down ${selectedLane.target_player} the moment the ball is played.`
                      : `This is an open escape route for the ball carrier. The defending block may be deliberately allowing this pass to funnel play into the next pressing trap.`}
                </p>
              </div>

              {selectedLane.cover_shadow_defenders && selectedLane.cover_shadow_defenders.length > 0 && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} color="#f43f5e" />
                  <span>Cover shadow maintained by: <strong>{selectedLane.cover_shadow_defenders.join(', ')}</strong></span>
                </div>
              )}
            </div>

            <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={onClearSelection} title="Close explanation" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Case 2: Pressing Trap / Direction Vector Selected
  if (selectedTrap) {
    const funnel = spatialMetrics?.pressing_funnel?.replace(/_/g, ' ').toUpperCase() || 'TOUCHLINE LOCK'
    return (
      <Card style={{ borderLeft: '4px solid #f43f5e' }}>
        <CardContent style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Badge variant="danger" icon={<Flame size={12} />}>
                  TACTICAL PRESSING TRAP
                </Badge>
                <span style={{ fontSize: '0.8125rem', color: '#fca5a5', fontWeight: 600 }}>
                  {funnel}
                </span>
              </div>

              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Defensive Trap: Forcing the Ball Wide
                </h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {report?.pressing_strategy?.pressing_direction ||
                    'The defending team coordinates their movement to steer the ball carrier toward the touchline. By using the sideline as an extra defender, they cut passing options in half and trap the opponent in congested space.'}
                </p>
              </div>

              {report?.pressing_triggers && report.pressing_triggers.tactical_traps.length > 0 && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  <strong>Key Trap:</strong> {report.pressing_triggers.tactical_traps[0]}
                </div>
              )}
            </div>

            <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={onClearSelection} title="Close explanation" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Case 3: Compactness Block Selected
  if (selectedCompactness && spatialMetrics?.compactness) {
    const { vertical_block_length_meters, horizontal_block_width_meters, is_compact } = spatialMetrics.compactness
    return (
      <Card style={{ borderLeft: '4px solid var(--color-tactical)' }}>
        <CardContent style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Badge variant="tactical" icon={<Compass size={12} />}>
                  DEFENSIVE COMPACTNESS
                </Badge>
                <Badge variant={is_compact ? 'pitch' : 'warning'}>
                  {is_compact ? 'Highly Compact' : 'Stretched Shape'}
                </Badge>
              </div>

              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Defending Block Shape ({vertical_block_length_meters}m long &times; {horizontal_block_width_meters}m wide)
                </h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  The outfield defending unit stays compressed in this rectangle. A compact block ensures the opponent cannot find comfortable passing options into the midfield &ldquo;pocket&rdquo; between the defensive and midfield lines.
                </p>
              </div>
            </div>

            <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={onClearSelection} title="Close explanation" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Case 4: Player Selected
  if (selectedPlayer && selectedTeam) {
    const isAttacking = selectedTeam === 'attacking'
    const teamName = isAttacking ? attackingTeamName : defendingTeamName
    const zone = getPitchZone(selectedPlayer.position.x, selectedPlayer.position.y)

    // Check specific tactical roles
    const isPrimaryPresser = Boolean(
      !isAttacking &&
        spatialMetrics?.primary_presser &&
        (selectedPlayer.id === spatialMetrics.primary_presser.id ||
          selectedPlayer.number === spatialMetrics.primary_presser.number),
    )

    const isSupportingPresser = Boolean(
      !isAttacking &&
        !isPrimaryPresser &&
        spatialMetrics?.supporting_pressers?.some(
          (sp) => sp.id === selectedPlayer.id || sp.number === selectedPlayer.number,
        ),
    )

    const isBallCarrier = Boolean(
      isAttacking &&
        spatialMetrics?.ball_carrier &&
        (selectedPlayer.name === spatialMetrics.ball_carrier.name ||
          selectedPlayer.number === spatialMetrics.ball_carrier.number),
    )

    let roleDescription: string
    if (isPrimaryPresser) {
      roleDescription = `Primary Presser. ${selectedPlayer.name} sprints at the ball carrier while shaping their run to block the central passing lane and funnel the ball wide.`
    } else if (isBallCarrier) {
      roleDescription = `Ball Carrier. Under intense defensive pressure. Must make a split-second decision with limited forward passing options.`
    } else if (isSupportingPresser) {
      roleDescription = `Supporting Presser. Backing up the first wave of pressure, ready to pounce on any loose ball or tackle the receiver.`
    } else if (isAttacking) {
      roleDescription = `Attacking Option (${selectedPlayer.role}). Positioning in the ${zone} to provide width or depth for the ball carrier.`
    } else {
      roleDescription = `Defending Unit (${selectedPlayer.role}). Holding the defensive line in the ${zone} to ensure team compactness.`
    }

    return (
      <Card style={{ borderLeft: `4px solid ${isAttacking ? '#0284c7' : '#059669'}` }}>
        <CardContent style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <Badge variant={isAttacking ? 'default' : 'pitch'}>
                  {teamName}
                </Badge>
                {isPrimaryPresser && (
                  <Badge variant="danger" icon={<Flame size={12} />}>
                    1st Presser
                  </Badge>
                )}
                {isBallCarrier && (
                  <Badge variant="tactical" icon={<Crosshair size={12} />}>
                    On the Ball
                  </Badge>
                )}
                {isSupportingPresser && (
                  <Badge variant="warning" icon={<Shield size={12} />}>
                    Cover Support
                  </Badge>
                )}
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Pitch Zone: <strong style={{ color: 'var(--text-primary)' }}>{zone}</strong>
                </span>
              </div>

              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  #{selectedPlayer.number} {selectedPlayer.name} ({selectedPlayer.role})
                </h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {roleDescription}
                </p>
              </div>

              {isPrimaryPresser && spatialMetrics?.primary_presser?.distance_to_ball && (
                <div style={{ fontSize: '0.8125rem', color: '#f43f5e', fontWeight: 600 }}>
                  Distance to ball: {spatialMetrics.primary_presser.distance_to_ball}m
                </div>
              )}
            </div>

            <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={onClearSelection} title="Close explanation" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Case 5: Default Guide Prompt when nothing is selected
  return (
    <div
      style={{
        padding: '12px 18px',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px dashed var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        fontSize: '0.8125rem',
        color: 'var(--text-secondary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles size={16} color="var(--color-pitch)" style={{ flexShrink: 0 }} />
        <span>
          <strong>Interactive Pitch Guide:</strong> Click any <strong>player</strong>, <strong>passing lane</strong> (green/red/yellow lines), or the <strong>pressing arrow</strong> on the pitch to see why and how they are acting!
        </span>
      </div>
      <Badge variant="default" size="sm">
        Click to Inspect
      </Badge>
    </div>
  )
}
