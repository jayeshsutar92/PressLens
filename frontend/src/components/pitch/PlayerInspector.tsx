import { type FC, type ChangeEvent } from 'react'
import { Crosshair, X } from 'lucide-react'
import type { Player } from '../../types/scenario.ts'
import { getPitchZone } from '../../utils/zones.ts'
import { Badge, Button, Card, CardContent, CardHeader, Input } from '../common/index.ts'

export interface PlayerInspectorProps {
  player: Player | null
  team: 'attacking' | 'defending' | null
  teamName: string
  editable?: boolean
  onClose?: () => void
  onUpdatePlayer?: (updatedPlayer: Player) => void
}

export const PlayerInspector: FC<PlayerInspectorProps> = ({
  player,
  team,
  teamName,
  editable = false,
  onClose,
  onUpdatePlayer,
}) => {
  if (!player) {
    return (
      <Card>
        <CardContent style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Crosshair size={28} color="var(--text-dim)" style={{ marginBottom: '8px' }} />
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            No Player Selected
          </div>
          <div style={{ fontSize: '0.8125rem' }}>
            Click any player on the pitch canvas to inspect spatial positioning and tactical role.
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleCoordChange = (axis: 'x' | 'y', val: number) => {
    if (!editable || !onUpdatePlayer) return
    onUpdatePlayer({
      ...player,
      position: {
        ...player.position,
        [axis]: Math.round(val * 10) / 10,
      },
    })
  }

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!editable || !onUpdatePlayer) return
    onUpdatePlayer({
      ...player,
      name: e.target.value,
    })
  }

  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!editable || !onUpdatePlayer) return
    const num = parseInt(e.target.value, 10)
    if (!isNaN(num) && num >= 1 && num <= 99) {
      onUpdatePlayer({
        ...player,
        number: num,
      })
    }
  }

  const zone = getPitchZone(player.position.x, player.position.y)

  return (
    <Card>
      <CardHeader style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge variant={team === 'attacking' ? 'tactical' : 'pitch'}>
            {team === 'attacking' ? 'Attacking Team' : 'Defending Team'}
          </Badge>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {teamName}
          </span>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} style={{ padding: '4px', height: '28px', width: '28px' }}>
            <X size={16} />
          </Button>
        )}
      </CardHeader>
      <CardContent style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: team === 'attacking' ? '#0284c7' : '#059669',
              border: `2px solid ${team === 'attacking' ? '#38bdf8' : '#10b981'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1.125rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {player.number}
          </div>
          <div>
            <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {player.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <Badge variant="default">{player.role}</Badge>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {player.id}</span>
            </div>
          </div>
        </div>

        {/* Spatial Position Breakdown */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Current Pitch Sector
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-pitch-light)' }}>
            {zone}
          </div>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
            }}
          >
            <span>X: <strong>{player.position.x.toFixed(1)}m</strong></span>
            <span>Y: <strong>{player.position.y.toFixed(1)}m</strong></span>
          </div>
        </div>

        {/* Editable Controls */}
        {editable && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px' }}>
              <Input
                label="Number"
                type="number"
                min={1}
                max={99}
                value={player.number}
                onChange={handleNumberChange}
              />
              <Input
                label="Player Name"
                value={player.name}
                onChange={handleNameChange}
              />
            </div>

            {/* Coordinate Fine Tuning Sliders */}
            <div className="pl-field-group">
              <label className="pl-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Length (X-axis, 0 - 105m)</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{player.position.x.toFixed(1)}m</span>
              </label>
              <input
                type="range"
                min={0}
                max={105}
                step={0.5}
                value={player.position.x}
                onChange={(e) => handleCoordChange('x', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-pitch)' }}
              />
            </div>

            <div className="pl-field-group">
              <label className="pl-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Width (Y-axis, 0 - 68m)</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{player.position.y.toFixed(1)}m</span>
              </label>
              <input
                type="range"
                min={0}
                max={68}
                step={0.5}
                value={player.position.y}
                onChange={(e) => handleCoordChange('y', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-pitch)' }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
