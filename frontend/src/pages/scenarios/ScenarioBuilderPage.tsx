import { type FC, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Info,
  Save,
  Sparkles,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
} from '../../components/common/index.ts'
import { PlayerInspector, TacticalPitch } from '../../components/pitch/index.ts'
import { useApiMutation } from '../../hooks/useApi.ts'
import { scenarioService } from '../../api/services/scenarios.ts'
import type {
  BallPosition,
  MatchContext,
  MatchPhase,
  Player,
  ScenarioCreatePayload,
  TeamTacticalSetup,
} from '../../types/scenario.ts'
import {
  AVAILABLE_FORMATIONS,
  type FormationPreset,
  createDefaultTeamSetup,
} from '../../utils/formations.ts'
import { clamp, getPitchZone } from '../../utils/zones.ts'

export const ScenarioBuilderPage: FC = () => {
  const navigate = useNavigate()

  // Form State
  const [title, setTitle] = useState<string>('Custom Pressing Setup')
  const [description, setDescription] = useState<string>(
    'Coordinated pressing block trapping opponent build-up in wide half-spaces.',
  )
  const [matchPhase, setMatchPhase] = useState<MatchPhase>('high_press')
  const [tacticalSituation, setTacticalSituation] = useState<string>(
    'Opponent Build-Up from Deep Defensive Third',
  )

  // Team Setups
  const [attackingTeam, setAttackingTeam] = useState<TeamTacticalSetup>(() =>
    createDefaultTeamSetup('attacking', '4-3-3', 'Brighton & Hove Albion (Build-up)'),
  )
  const [defendingTeam, setDefendingTeam] = useState<TeamTacticalSetup>(() =>
    createDefaultTeamSetup('defending', '4-3-3', 'Liverpool (High Press)'),
  )

  // Ball & Match Context
  const [ballPosition, setBallPosition] = useState<BallPosition>({
    x: 18.0,
    y: 46.0,
    z: 0.0,
    zone: getPitchZone(18.0, 46.0),
  })

  const [matchContext, setMatchContext] = useState<MatchContext>({
    minute: 24,
    score: '0-0',
    competition: 'Premier League',
    pitch_dimensions: { length: 105.0, width: 68.0 },
  })

  // Selected Player for Pitch Inspection & Manipulation
  const [selectedPlayer, setSelectedPlayer] = useState<{
    player: Player
    team: 'attacking' | 'defending'
  } | null>(null)

  const [activeTab, setActiveTab] = useState<'basic' | 'attacking' | 'defending' | 'context'>('basic')
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Create Scenario API Mutation
  const { mutate: submitScenario, isLoading: isSubmitting, error: submitError } = useApiMutation(
    (payload: ScenarioCreatePayload) => scenarioService.createScenario(payload),
    {
      onSuccess: (newScenario) => {
        navigate(`/scenarios/${newScenario.id}`)
      },
    },
  )

  // Update Player Position from Pitch drag or click
  const handleUpdatePlayerPosition = (
    playerId: string,
    team: 'attacking' | 'defending',
    coords: { x: number; y: number },
  ) => {
    const clampedPos = {
      x: clamp(coords.x, 0, 105),
      y: clamp(coords.y, 0, 68),
    }

    if (team === 'attacking') {
      setAttackingTeam((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.id === playerId ? { ...p, position: clampedPos } : p,
        ),
      }))
    } else {
      setDefendingTeam((prev) => ({
        ...prev,
        players: prev.players.map((p) =>
          p.id === playerId ? { ...p, position: clampedPos } : p,
        ),
      }))
    }

    // Keep inspector updated
    if (selectedPlayer && selectedPlayer.player.id === playerId) {
      setSelectedPlayer({
        ...selectedPlayer,
        player: { ...selectedPlayer.player, position: clampedPos },
      })
    }
  }

  // Update Ball Position
  const handleUpdateBallPosition = (coords: { x: number; y: number }) => {
    const clampedPos = {
      x: clamp(coords.x, 0, 105),
      y: clamp(coords.y, 0, 68),
    }
    const zone = getPitchZone(clampedPos.x, clampedPos.y)
    setBallPosition((prev) => ({
      ...prev,
      ...clampedPos,
      zone,
    }))
  }

  // Change Formation and Auto-Populate Player Coordinates
  const handleFormationChange = (team: 'attacking' | 'defending', formation: FormationPreset) => {
    if (team === 'attacking') {
      const newSetup = createDefaultTeamSetup('attacking', formation, attackingTeam.name)
      setAttackingTeam(newSetup)
    } else {
      const newSetup = createDefaultTeamSetup('defending', formation, defendingTeam.name)
      setDefendingTeam(newSetup)
    }
    setSelectedPlayer(null)
  }

  // Validate and Submit
  const handleSubmit = async () => {
    const errors: string[] = []
    if (title.trim().length < 3) errors.push('Title must be at least 3 characters.')
    if (tacticalSituation.trim().length < 3) errors.push('Tactical situation is required.')
    if (!attackingTeam.name.trim()) errors.push('Attacking team name is required.')
    if (!defendingTeam.name.trim()) errors.push('Defending team name is required.')
    if (attackingTeam.players.length < 1) errors.push('Attacking team must have at least 1 player.')
    if (defendingTeam.players.length < 1) errors.push('Defending team must have at least 1 player.')

    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    setValidationErrors([])

    const payload: ScenarioCreatePayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      match_phase: matchPhase,
      tactical_situation: tacticalSituation.trim(),
      attacking_team: attackingTeam,
      defending_team: defendingTeam,
      ball_position: ballPosition,
      match_context: matchContext,
    }

    try {
      await submitScenario(payload)
    } catch {
      // Error handled by mutation state
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/scenarios">
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />}>
              Back to Scenarios
            </Button>
          </Link>
          <Badge variant="pitch" icon={<Sparkles size={12} />}>
            Interactive Scenario Studio
          </Badge>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button
            variant="primary"
            icon={<Save size={16} />}
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            Save Tactical Scenario
          </Button>
        </div>
      </div>

      {/* Errors Banner */}
      {(validationErrors.length > 0 || submitError) && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--color-danger)',
            fontSize: '0.875rem',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '6px' }}>Please resolve the following issues:</div>
          <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            {validationErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
            {submitError && <li>{submitError.message}</li>}
          </ul>
        </div>
      )}

      {/* Main Studio Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(360px, 1fr)',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Interactive Pitch */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TacticalPitch
            attackingTeam={attackingTeam}
            defendingTeam={defendingTeam}
            ballPosition={ballPosition}
            selectedPlayerId={selectedPlayer?.player.id}
            onSelectPlayer={(p, team) => setSelectedPlayer({ player: p, team })}
            editable
            onUpdatePlayerPosition={handleUpdatePlayerPosition}
            onUpdateBallPosition={handleUpdateBallPosition}
            height="580px"
            showZones
          />

          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Info size={16} color="var(--color-pitch)" />
            <span>
              <strong>Tip:</strong> Drag or click players to reposition. Select a player and click on the pitch to move them instantly.
            </span>
          </div>
        </div>

        {/* Right Column: Inspector & Form Configuration Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Active Player Inspector in Editable Mode */}
          <PlayerInspector
            player={selectedPlayer?.player || null}
            team={selectedPlayer?.team || null}
            teamName={
              selectedPlayer?.team === 'attacking' ? attackingTeam.name : defendingTeam.name
            }
            editable
            onClose={() => setSelectedPlayer(null)}
            onUpdatePlayer={(upd) => {
              if (!selectedPlayer) return
              handleUpdatePlayerPosition(upd.id, selectedPlayer.team, upd.position)
            }}
          />

          {/* Form Tabs */}
          <Card>
            <CardHeader style={{ padding: '12px 16px', display: 'flex', gap: '6px' }}>
              <Button
                variant={activeTab === 'basic' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('basic')}
              >
                Metadata
              </Button>
              <Button
                variant={activeTab === 'attacking' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('attacking')}
              >
                Attacking Team
              </Button>
              <Button
                variant={activeTab === 'defending' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('defending')}
              >
                Defending Team
              </Button>
              <Button
                variant={activeTab === 'context' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('context')}
              >
                Match & Ball
              </Button>
            </CardHeader>

            <CardContent style={{ padding: '20px' }}>
              {/* Tab 1: Basic Scenario Information */}
              {activeTab === 'basic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <Input
                    label="Scenario Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Manchester City 3-2 Rest Defense Counter-Press"
                  />

                  <Input
                    label="Tactical Situation"
                    value={tacticalSituation}
                    onChange={(e) => setTacticalSituation(e.target.value)}
                    placeholder="e.g. Turnover in central Zone 14 leading to immediate press"
                  />

                  <div className="pl-field-group">
                    <label className="pl-label">Match Phase</label>
                    <select
                      className="pl-input"
                      value={matchPhase}
                      onChange={(e) => setMatchPhase(e.target.value as MatchPhase)}
                    >
                      <option value="high_press">High Press (Final Third Possession Win)</option>
                      <option value="counter_press">Counter-Press (Immediate 5-Second Transition)</option>
                      <option value="mid_block">Mid-Block (Compact Zonal Corridor Trap)</option>
                      <option value="low_block">Low-Block (Deep Penalty Box Shield)</option>
                      <option value="defensive_transition">Defensive Transition (Rest Defense Recovery)</option>
                    </select>
                  </div>

                  <div className="pl-field-group">
                    <label className="pl-label">Tactical Narrative (Description)</label>
                    <textarea
                      className="pl-input"
                      style={{ height: '80px', resize: 'vertical' }}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the pressing triggers, passing traps, and defensive shape..."
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Attacking Team Configuration */}
              {activeTab === 'attacking' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <Input
                    label="Attacking Team Name"
                    value={attackingTeam.name}
                    onChange={(e) =>
                      setAttackingTeam((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />

                  <div className="pl-field-group">
                    <label className="pl-label">Formation Preset</label>
                    <select
                      className="pl-input"
                      value={attackingTeam.formation}
                      onChange={(e) =>
                        handleFormationChange('attacking', e.target.value as FormationPreset)
                      }
                    >
                      {AVAILABLE_FORMATIONS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {attackingTeam.players.length} players placed on pitch. Click on players to reposition them.
                  </div>
                </div>
              )}

              {/* Tab 3: Defending Team Configuration */}
              {activeTab === 'defending' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <Input
                    label="Defending Team Name"
                    value={defendingTeam.name}
                    onChange={(e) =>
                      setDefendingTeam((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />

                  <div className="pl-field-group">
                    <label className="pl-label">Formation Preset</label>
                    <select
                      className="pl-input"
                      value={defendingTeam.formation}
                      onChange={(e) =>
                        handleFormationChange('defending', e.target.value as FormationPreset)
                      }
                    >
                      {AVAILABLE_FORMATIONS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {defendingTeam.players.length} players placed on pitch. Click on players to reposition them.
                  </div>
                </div>
              )}

              {/* Tab 4: Match Context & Ball Coordinates */}
              {activeTab === 'context' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <Input
                      label="Match Minute"
                      type="number"
                      min={0}
                      max={120}
                      value={matchContext.minute ?? 0}
                      onChange={(e) =>
                        setMatchContext((prev) => ({
                          ...prev,
                          minute: parseInt(e.target.value, 10) || 0,
                        }))
                      }
                    />
                    <Input
                      label="Score"
                      value={matchContext.score || '0-0'}
                      onChange={(e) =>
                        setMatchContext((prev) => ({ ...prev, score: e.target.value }))
                      }
                    />
                  </div>

                  <Input
                    label="Competition"
                    value={matchContext.competition || ''}
                    onChange={(e) =>
                      setMatchContext((prev) => ({ ...prev, competition: e.target.value }))
                    }
                  />

                  {/* Ball Coordinates */}
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      Ball Location & Zone
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-pitch-light)' }}>
                      {ballPosition.zone}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <Input
                        label="Ball X (0-105m)"
                        type="number"
                        step={0.5}
                        value={ballPosition.x}
                        onChange={(e) => handleUpdateBallPosition({ x: parseFloat(e.target.value) || 0, y: ballPosition.y })}
                      />
                      <Input
                        label="Ball Y (0-68m)"
                        type="number"
                        step={0.5}
                        value={ballPosition.y}
                        onChange={(e) => handleUpdateBallPosition({ x: ballPosition.x, y: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
