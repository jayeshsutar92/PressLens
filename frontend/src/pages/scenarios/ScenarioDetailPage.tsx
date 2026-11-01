import { type FC, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Compass,
  Info,
  MapPin,
  Trash2,
  Trophy,
  Zap,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  LoadingSpinner,
  Modal,
} from '../../components/common/index.ts'
import { PlayerInspector, TacticalPitch } from '../../components/pitch/index.ts'
import { useApiMutation, useApiQuery } from '../../hooks/useApi.ts'
import { scenarioService } from '../../api/services/scenarios.ts'
import type { Player } from '../../types/scenario.ts'
import { formatDate, formatMatchPhase } from '../../utils/formatters.ts'

export const ScenarioDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [selectedPlayer, setSelectedPlayer] = useState<{
    player: Player
    team: 'attacking' | 'defending'
  } | null>(null)

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'context' | 'attacking' | 'defending'>('context')

  // Fetch full scenario
  const {
    data: scenario,
    isLoading,
    error,
    refetch,
  } = useApiQuery(
    () => (id ? scenarioService.getScenarioById(id) : Promise.reject(new Error('No scenario ID'))),
    [id],
    { enabled: Boolean(id) },
  )

  // Delete mutation
  const { mutate: deleteScenario, isLoading: isDeleting } = useApiMutation(
    () => (id ? scenarioService.deleteScenario(id) : Promise.reject(new Error('No scenario ID'))),
    {
      onSuccess: () => {
        navigate('/scenarios')
      },
    },
  )

  const handleDeleteConfirm = async () => {
    try {
      await deleteScenario(undefined)
    } catch {
      // Error handled by mutation state
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !scenario) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Link to="/scenarios">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />}>
            Back to Scenarios
          </Button>
        </Link>
        <EmptyState
          icon={<Compass size={28} />}
          title="Scenario Not Found"
          description={error?.message || `No scenario with ID ${id} exists.`}
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header & Breadcrumbs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/scenarios">
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />}>
              Scenarios
            </Button>
          </Link>
          <span style={{ color: 'var(--border-strong)' }}>/</span>
          <Badge variant={scenario.is_prepared ? 'pitch' : 'default'}>
            {scenario.is_prepared ? 'Prepared Demonstration' : 'Custom User Scenario'}
          </Badge>
          <Badge variant="tactical">{formatMatchPhase(scenario.match_phase)}</Badge>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to={`/analysis?scenario_id=${scenario.id}`}>
            <Button variant="primary" size="sm" icon={<Zap size={14} />}>
              Analyze with AI
            </Button>
          </Link>
          {!scenario.is_prepared && (
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={15} />}
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Scenario
            </Button>
          )}
        </div>
      </div>

      {/* Scenario Title Header */}
      <div>
        <h2
          style={{
            margin: '0 0 6px 0',
            fontSize: '1.75rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
          }}
        >
          {scenario.title}
        </h2>
        <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
          {scenario.tactical_situation}
        </p>
      </div>

      {/* Pitch & Tactical Details Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(340px, 1fr)',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Interactive Pitch */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TacticalPitch
            attackingTeam={scenario.attacking_team}
            defendingTeam={scenario.defending_team}
            ballPosition={scenario.ball_position}
            selectedPlayerId={selectedPlayer?.player.id}
            onSelectPlayer={(p, team) => setSelectedPlayer({ player: p, team })}
            height="560px"
            showZones
          />

          {/* Description Card */}
          {scenario.description && (
            <Card>
              <CardHeader style={{ padding: '16px 20px' }}>
                <CardTitle style={{ fontSize: '0.9375rem' }}>
                  <Info size={16} color="var(--color-tactical)" />
                  Tactical Context & Narrative
                </CardTitle>
              </CardHeader>
              <CardContent style={{ padding: '16px 20px', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {scenario.description}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Inspector & Context Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Active Player Inspector */}
          <PlayerInspector
            player={selectedPlayer?.player || null}
            team={selectedPlayer?.team || null}
            teamName={
              selectedPlayer?.team === 'attacking'
                ? scenario.attacking_team.name
                : scenario.defending_team.name
            }
            onClose={() => setSelectedPlayer(null)}
          />

          {/* Context Details Card */}
          <Card>
            <CardHeader style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
              <Button
                variant={activeTab === 'context' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('context')}
              >
                Match Context
              </Button>
              <Button
                variant={activeTab === 'attacking' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('attacking')}
              >
                {scenario.attacking_team.name.split(' ')[0]}
              </Button>
              <Button
                variant={activeTab === 'defending' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('defending')}
              >
                {scenario.defending_team.name.split(' ')[0]}
              </Button>
            </CardHeader>

            <CardContent style={{ padding: '16px 20px' }}>
              {activeTab === 'context' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} /> Minute:
                    </span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {scenario.match_context?.minute !== undefined ? `${scenario.match_context.minute}'` : 'N/A'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Zap size={14} /> Current Score:
                    </span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {scenario.match_context?.score || '0 - 0'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Trophy size={14} /> Competition:
                    </span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {scenario.match_context?.competition || 'Tactical Exhibition'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} /> Ball Location:
                    </span>
                    <span style={{ color: 'var(--color-pitch-light)', fontWeight: 600 }}>
                      {scenario.ball_position.zone || 'In Play'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} /> Recorded:
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(scenario.created_at)}
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'attacking' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {scenario.attacking_team.name}
                    </span>
                    <Badge variant="tactical">{scenario.attacking_team.formation}</Badge>
                  </div>
                  {scenario.attacking_team.players.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlayer({ player: p, team: 'attacking' })}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: selectedPlayer?.player.id === p.id ? 'var(--bg-hover)' : 'var(--bg-elevated)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--color-tactical-light)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          #{p.number}
                        </span>
                        <span style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                      </div>
                      <Badge variant="default">{p.role}</Badge>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'defending' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {scenario.defending_team.name}
                    </span>
                    <Badge variant="pitch">{scenario.defending_team.formation}</Badge>
                  </div>
                  {scenario.defending_team.players.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlayer({ player: p, team: 'defending' })}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: selectedPlayer?.player.id === p.id ? 'var(--bg-hover)' : 'var(--bg-elevated)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--color-pitch-light)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          #{p.number}
                        </span>
                        <span style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                      </div>
                      <Badge variant="default">{p.role}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Custom Scenario"
        description="Are you sure you want to permanently delete this scenario from the database?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} isLoading={isDeleting}>
              Confirm Delete
            </Button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          This will delete <strong>{scenario.title}</strong> and all associated player coordinates.
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
