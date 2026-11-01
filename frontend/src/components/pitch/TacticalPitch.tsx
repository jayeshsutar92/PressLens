import {
  type FC,
  type MouseEvent,
  useCallback,
  useRef,
  useState,
} from 'react'
import {
  Grid,
  Tag,
} from 'lucide-react'
import type { BallPosition, Player, TeamTacticalSetup } from '../../types/scenario.ts'
import { PITCH_LENGTH, PITCH_WIDTH, clamp, getPitchZone } from '../../utils/zones.ts'

export interface TacticalPitchProps {
  attackingTeam: TeamTacticalSetup
  defendingTeam: TeamTacticalSetup
  ballPosition: BallPosition
  selectedPlayerId?: string | null
  onSelectPlayer?: (player: Player, team: 'attacking' | 'defending') => void
  editable?: boolean
  onUpdatePlayerPosition?: (
    playerId: string,
    team: 'attacking' | 'defending',
    position: { x: number; y: number },
  ) => void
  onUpdateBallPosition?: (position: { x: number; y: number }) => void
  showZones?: boolean
  showLabels?: boolean
  className?: string
  height?: number | string
}

export const TacticalPitch: FC<TacticalPitchProps> = ({
  attackingTeam,
  defendingTeam,
  ballPosition,
  selectedPlayerId,
  onSelectPlayer,
  editable = false,
  onUpdatePlayerPosition,
  onUpdateBallPosition,
  showZones: initialShowZones = false,
  showLabels: initialShowLabels = true,
  className = '',
  height = '520px',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [showZones, setShowZones] = useState<boolean>(initialShowZones)
  const [showLabels, setShowLabels] = useState<boolean>(initialShowLabels)
  const [hoveredCoords, setHoveredCoords] = useState<{ x: number; y: number } | null>(null)
  const [isBallSelected, setIsBallSelected] = useState<boolean>(false)
  const [draggingEntity, setDraggingEntity] = useState<{
    id: string
    type: 'attacking' | 'defending' | 'ball'
  } | null>(null)

  // Converts client mouse event into pitch meters coordinates (x in [0, 105], y in [0, 68])
  const getPitchCoords = useCallback((e: MouseEvent<SVGSVGElement>): { x: number; y: number } => {
    if (!svgRef.current) return { x: 52.5, y: 34.0 }
    const rect = svgRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    // Pitch viewport is 0..105 (X) and 0..68 (Y)
    const normX = (clickX / rect.width) * (PITCH_LENGTH + 8) - 4
    const normY = (clickY / rect.height) * (PITCH_WIDTH + 8) - 4

    return {
      x: Math.round(clamp(normX, 0, PITCH_LENGTH) * 10) / 10,
      y: Math.round(clamp(normY, 0, PITCH_WIDTH) * 10) / 10,
    }
  }, [])

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    const coords = getPitchCoords(e)
    setHoveredCoords(coords)

    if (editable && draggingEntity) {
      if (draggingEntity.type === 'ball') {
        onUpdateBallPosition?.(coords)
      } else {
        onUpdatePlayerPosition?.(draggingEntity.id, draggingEntity.type, coords)
      }
    }
  }

  const handlePitchClick = (e: MouseEvent<SVGSVGElement>) => {
    if (!editable) return

    const coords = getPitchCoords(e)

    if (isBallSelected) {
      onUpdateBallPosition?.(coords)
      return
    }

    if (selectedPlayerId) {
      // Find whether selected player belongs to attacking or defending team
      const isAtt = attackingTeam.players.some((p) => p.id === selectedPlayerId)
      const team = isAtt ? 'attacking' : 'defending'
      onUpdatePlayerPosition?.(selectedPlayerId, team, coords)
    }
  }

  const handleMouseUp = () => {
    if (draggingEntity) {
      setDraggingEntity(null)
    }
  }

  const handlePlayerMouseDown = (
    e: MouseEvent,
    player: Player,
    team: 'attacking' | 'defending',
  ) => {
    e.stopPropagation()
    setIsBallSelected(false)
    onSelectPlayer?.(player, team)

    if (editable) {
      setDraggingEntity({ id: player.id, type: team })
    }
  }

  const handleBallMouseDown = (e: MouseEvent) => {
    e.stopPropagation()
    setIsBallSelected(true)

    if (editable) {
      setDraggingEntity({ id: 'match_ball', type: 'ball' })
    }
  }

  return (
    <div
      className={`pl-pitch-wrapper ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: '#070b12',
        border: '1px solid var(--border-default)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {/* Pitch Header / Quick Controls Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          backgroundColor: '#0a0f18',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '0.8125rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Attacking Team Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '9999px',
                backgroundColor: '#0284c7',
                border: '1px solid #38bdf8',
                boxShadow: '0 0 6px rgba(56, 189, 248, 0.4)',
              }}
            />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {attackingTeam.name}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              ({attackingTeam.formation})
            </span>
          </div>

          <span style={{ color: 'var(--border-strong)' }}>&bull;</span>

          {/* Defending Team Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '9999px',
                backgroundColor: '#059669',
                border: '1px solid #10b981',
                boxShadow: '0 0 6px rgba(16, 185, 129, 0.4)',
              }}
            />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {defendingTeam.name}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              ({defendingTeam.formation})
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {hoveredCoords && (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-xs)',
                marginRight: '8px',
              }}
            >
              x:{hoveredCoords.x.toFixed(1)}m, y:{hoveredCoords.y.toFixed(1)}m
            </div>
          )}

          <button
            type="button"
            className="pl-btn pl-btn-ghost pl-btn-sm"
            onClick={() => setShowZones((prev) => !prev)}
            style={{
              height: '28px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              color: showZones ? 'var(--color-pitch-light)' : 'var(--text-secondary)',
              backgroundColor: showZones ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
            }}
            title="Toggle Tactical Zones (Corridors & Zone 14)"
          >
            <Grid size={14} />
            <span>Zones</span>
          </button>

          <button
            type="button"
            className="pl-btn pl-btn-ghost pl-btn-sm"
            onClick={() => setShowLabels((prev) => !prev)}
            style={{
              height: '28px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              color: showLabels ? 'var(--color-tactical-light)' : 'var(--text-secondary)',
              backgroundColor: showLabels ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            }}
            title="Toggle Player Names and Role Labels"
          >
            <Tag size={14} />
            <span>Labels</span>
          </button>
        </div>
      </div>

      {/* Main Pitch Canvas */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: height,
          backgroundColor: '#07120c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: editable ? (draggingEntity ? 'grabbing' : 'crosshair') : 'default',
          userSelect: 'none',
        }}
      >
        <svg
          ref={svgRef}
          viewBox="-4 -4 113 76"
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: '100%', display: 'block' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredCoords(null)}
          onMouseUp={handleMouseUp}
          onClick={handlePitchClick}
        >
          <defs>
            {/* Dark Turf Stripes Pattern */}
            <linearGradient id="turfGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0c1f15" />
              <stop offset="100%" stopColor="#08160f" />
            </linearGradient>

            <pattern id="turfStripes" width="10.5" height="68" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="5.25" height="68" fill="#0c1e14" />
              <rect x="5.25" y="0" width="5.25" height="68" fill="#0a1a11" />
            </pattern>

            {/* Radial Glows */}
            <radialGradient id="ballGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="selectionHalo" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="85%" stopColor="#10b981" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>

            {/* Drop Shadows */}
            <filter id="playerShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0.6" stdDeviation="0.6" floodColor="#000000" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Pitch Outer Turf Boundary */}
          <rect x="-4" y="-4" width="113" height="76" fill="#07130d" />

          {/* Playing Surface */}
          <rect x="0" y="0" width="105" height="68" fill="url(#turfStripes)" />

          {/* Tactical Zones & Grid Corridors (Overlay) */}
          {showZones && (
            <g id="tacticalGrid" opacity="0.85">
              {/* 5 Vertical Channels */}
              <line x1="0" y1="13.6" x2="105" y2="13.6" stroke="#34d399" strokeWidth="0.15" strokeDasharray="1.5,1.5" />
              <line x1="0" y1="27.2" x2="105" y2="27.2" stroke="#34d399" strokeWidth="0.15" strokeDasharray="1.5,1.5" />
              <line x1="0" y1="40.8" x2="105" y2="40.8" stroke="#34d399" strokeWidth="0.15" strokeDasharray="1.5,1.5" />
              <line x1="0" y1="54.4" x2="105" y2="54.4" stroke="#34d399" strokeWidth="0.15" strokeDasharray="1.5,1.5" />

              {/* Pitch Thirds */}
              <line x1="35" y1="0" x2="35" y2="68" stroke="#38bdf8" strokeWidth="0.2" strokeDasharray="2,2" />
              <line x1="70" y1="0" x2="70" y2="68" stroke="#38bdf8" strokeWidth="0.2" strokeDasharray="2,2" />

              {/* Zone 14 Highlight */}
              <rect
                x="70"
                y="23"
                width="18.5"
                height="22"
                fill="rgba(245, 158, 11, 0.08)"
                stroke="#f59e0b"
                strokeWidth="0.2"
                strokeDasharray="1,1"
              />
              <text
                x="79.25"
                y="34.5"
                fill="#fbbf24"
                fontSize="1.6"
                fontWeight="700"
                textAnchor="middle"
                opacity="0.8"
                fontFamily="var(--font-mono)"
              >
                ZONE 14
              </text>

              {/* Channel Watermark Labels */}
              <text x="52.5" y="8" fill="#34d399" fontSize="1.1" textAnchor="middle" opacity="0.35">
                LEFT WING
              </text>
              <text x="52.5" y="21" fill="#34d399" fontSize="1.1" textAnchor="middle" opacity="0.35">
                LEFT HALF-SPACE
              </text>
              <text x="52.5" y="34.5" fill="#34d399" fontSize="1.1" textAnchor="middle" opacity="0.35">
                CENTRAL CHANNEL
              </text>
              <text x="52.5" y="48" fill="#34d399" fontSize="1.1" textAnchor="middle" opacity="0.35">
                RIGHT HALF-SPACE
              </text>
              <text x="52.5" y="61" fill="#34d399" fontSize="1.1" textAnchor="middle" opacity="0.35">
                RIGHT WING
              </text>
            </g>
          )}

          {/* Regulation Pitch Markings */}
          <g id="pitchLines" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="0.3" fill="none">
            {/* Outer Perimeter */}
            <rect x="0" y="0" width="105" height="68" />

            {/* Halfway Line */}
            <line x1="52.5" y1="0" x2="52.5" y2="68" />

            {/* Center Circle & Center Spot */}
            <circle cx="52.5" cy="34" r="9.15" />
            <circle cx="52.5" cy="34" r="0.4" fill="rgba(255, 255, 255, 0.7)" />

            {/* Left Penalty Area */}
            <rect x="0" y="13.84" width="16.5" height="40.32" />
            <rect x="0" y="24.84" width="5.5" height="18.32" />
            <circle cx="11.0" cy="34.0" r="0.35" fill="rgba(255, 255, 255, 0.7)" />
            {/* Left Penalty Arc (radius 9.15 centered at 11, 34; outside the box x >= 16.5) */}
            <path d="M 16.5 26.68 A 9.15 9.15 0 0 1 16.5 41.32" />

            {/* Right Penalty Area */}
            <rect x="88.5" y="13.84" width="16.5" height="40.32" />
            <rect x="99.5" y="24.84" width="5.5" height="18.32" />
            <circle cx="94.0" cy="34.0" r="0.35" fill="rgba(255, 255, 255, 0.7)" />
            {/* Right Penalty Arc (radius 9.15 centered at 94, 34; outside the box x <= 88.5) */}
            <path d="M 88.5 26.68 A 9.15 9.15 0 0 0 88.5 41.32" />

            {/* Goal Posts & Nets */}
            <rect x="-2.4" y="30.34" width="2.4" height="7.32" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.25" />
            <rect x="105" y="30.34" width="2.4" height="7.32" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.25" />

            {/* Corner Arcs (1m radius) */}
            <path d="M 0 1 A 1 1 0 0 0 1 0" />
            <path d="M 0 67 A 1 1 0 0 1 1 68" />
            <path d="M 104 0 A 1 1 0 0 0 105 1" />
            <path d="M 104 68 A 1 1 0 0 1 105 67" />
          </g>

          {/* Attacking Team Players */}
          <g id="attackingTeam">
            {attackingTeam.players.map((player) => {
              const isSelected = selectedPlayerId === player.id
              const isGK = player.role === 'GK'
              const fill = isGK ? '#f59e0b' : '#0284c7'
              const stroke = isGK ? '#fbbf24' : '#38bdf8'

              return (
                <g
                  key={player.id}
                  transform={`translate(${player.position.x}, ${player.position.y})`}
                  style={{ cursor: editable ? 'grab' : 'pointer' }}
                  onMouseDown={(e) => handlePlayerMouseDown(e, player, 'attacking')}
                >
                  {/* Selection Halo */}
                  {isSelected && (
                    <circle cx="0" cy="0" r="3.6" fill="none" stroke="#38bdf8" strokeWidth="0.3" strokeDasharray="0.8,0.8" />
                  )}

                  {/* Player Token Circle */}
                  <circle
                    cx="0"
                    cy="0"
                    r="2.2"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="0.3"
                    filter="url(#playerShadow)"
                  />

                  {/* Player Number */}
                  <text
                    x="0"
                    y="0.75"
                    fill="#ffffff"
                    fontSize="1.8"
                    fontWeight="700"
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                    pointerEvents="none"
                  >
                    {player.number}
                  </text>

                  {/* Role / Name Label */}
                  {showLabels && (
                    <g pointerEvents="none">
                      <rect
                        x="-4.5"
                        y="2.8"
                        width="9.0"
                        height="2.0"
                        rx="0.8"
                        fill="rgba(7, 11, 18, 0.85)"
                        stroke="rgba(56, 189, 248, 0.4)"
                        strokeWidth="0.1"
                      />
                      <text
                        x="0"
                        y="4.25"
                        fill="#f8fafc"
                        fontSize="1.15"
                        fontWeight="600"
                        textAnchor="middle"
                        fontFamily="var(--font-sans)"
                      >
                        {player.role} &bull; {player.name.split(' ').pop()}
                      </text>
                    </g>
                  )}
                </g>
              )
            })}
          </g>

          {/* Defending Team Players */}
          <g id="defendingTeam">
            {defendingTeam.players.map((player) => {
              const isSelected = selectedPlayerId === player.id
              const isGK = player.role === 'GK'
              const fill = isGK ? '#a855f7' : '#059669'
              const stroke = isGK ? '#c084fc' : '#10b981'

              return (
                <g
                  key={player.id}
                  transform={`translate(${player.position.x}, ${player.position.y})`}
                  style={{ cursor: editable ? 'grab' : 'pointer' }}
                  onMouseDown={(e) => handlePlayerMouseDown(e, player, 'defending')}
                >
                  {/* Selection Halo */}
                  {isSelected && (
                    <circle cx="0" cy="0" r="3.6" fill="none" stroke="#10b981" strokeWidth="0.3" strokeDasharray="0.8,0.8" />
                  )}

                  {/* Player Token Circle */}
                  <circle
                    cx="0"
                    cy="0"
                    r="2.2"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="0.3"
                    filter="url(#playerShadow)"
                  />

                  {/* Player Number */}
                  <text
                    x="0"
                    y="0.75"
                    fill="#ffffff"
                    fontSize="1.8"
                    fontWeight="700"
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                    pointerEvents="none"
                  >
                    {player.number}
                  </text>

                  {/* Role / Name Label */}
                  {showLabels && (
                    <g pointerEvents="none">
                      <rect
                        x="-4.5"
                        y="2.8"
                        width="9.0"
                        height="2.0"
                        rx="0.8"
                        fill="rgba(7, 11, 18, 0.85)"
                        stroke="rgba(16, 185, 129, 0.4)"
                        strokeWidth="0.1"
                      />
                      <text
                        x="0"
                        y="4.25"
                        fill="#f8fafc"
                        fontSize="1.15"
                        fontWeight="600"
                        textAnchor="middle"
                        fontFamily="var(--font-sans)"
                      >
                        {player.role} &bull; {player.name.split(' ').pop()}
                      </text>
                    </g>
                  )}
                </g>
              )
            })}
          </g>

          {/* Match Ball */}
          <g
            id="matchBall"
            transform={`translate(${ballPosition.x}, ${ballPosition.y})`}
            style={{ cursor: editable ? 'grab' : 'pointer' }}
            onMouseDown={handleBallMouseDown}
          >
            {/* Ball Glow */}
            <circle cx="0" cy="0" r="2.8" fill="url(#ballGlow)" />

            {/* Ball Body */}
            <circle cx="0" cy="0" r="1.1" fill="#ffffff" stroke="#1e293b" strokeWidth="0.25" />

            {/* Pentagon Markings */}
            <polygon points="0,-0.4 0.38,-0.12 0.23,0.35 -0.23,0.35 -0.38,-0.12" fill="#0f172a" />

            {isBallSelected && (
              <circle cx="0" cy="0" r="2.0" fill="none" stroke="#f59e0b" strokeWidth="0.2" strokeDasharray="0.5,0.5" />
            )}
          </g>
        </svg>
      </div>

      {/* Pitch Footer / Quick State Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          backgroundColor: '#0a0f18',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>
            Pitch Dimensions: <strong>105m &times; 68m</strong>
          </span>
          <span>&bull;</span>
          <span>
            Ball: <strong>{ballPosition.zone || getPitchZone(ballPosition.x, ballPosition.y)}</strong> (x:
            {ballPosition.x}m, y:{ballPosition.y}m)
          </span>
        </div>

        {editable && (
          <span style={{ color: 'var(--color-pitch-light)' }}>
            Click or drag players / ball to update tactical coordinates
          </span>
        )}
      </div>
    </div>
  )
}
