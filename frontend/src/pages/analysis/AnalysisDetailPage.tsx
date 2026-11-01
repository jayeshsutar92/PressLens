import { type FC, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Compass,
  FileText,
  History,
  MessageSquare,
  MousePointerClick,
  RefreshCw,
  ShieldCheck,
  Sparkles,
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
} from '../../components/common/index.ts'
import { PitchSelectionExplainer, TacticalPitch } from '../../components/pitch/index.ts'
import { AnalysisReportView, FollowUpConversation } from '../../components/analysis/index.ts'
import { useApiQuery } from '../../hooks/useApi.ts'
import { analysisService } from '../../api/services/analysis.ts'
import { scenarioService } from '../../api/services/scenarios.ts'
import { saveRecentAnalysis } from '../../utils/recentAnalyses.ts'
import type { Player } from '../../types/scenario.ts'
import type { PassingLaneMetric } from '../../types/analysis.ts'

export const AnalysisDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<'report' | 'discussion'>('report')

  // Interactive Pitch Selection State
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<'attacking' | 'defending' | null>(null)
  const [selectedLane, setSelectedLane] = useState<PassingLaneMetric | null>(null)
  const [selectedLaneIndex, setSelectedLaneIndex] = useState<number | null>(null)
  const [selectedTrap, setSelectedTrap] = useState(false)
  const [selectedCompactness, setSelectedCompactness] = useState(false)

  // 1. Fetch Analysis Record
  const {
    data: analysis,
    isLoading: loadingAnalysis,
    error: analysisError,
    refetch: refetchAnalysis,
  } = useApiQuery(
    () => (id ? analysisService.getAnalysisById(id) : Promise.reject(new Error('No ID provided'))),
    [id],
    { enabled: Boolean(id) },
  )

  // 2. Fetch Associated Scenario
  const {
    data: scenario,
    isLoading: loadingScenario,
  } = useApiQuery(
    () => (analysis?.scenario_id ? scenarioService.getScenarioById(analysis.scenario_id) : Promise.resolve(null)),
    [analysis?.scenario_id],
    { enabled: Boolean(analysis?.scenario_id) },
  )

  // Archive in recent analyses when loaded
  useEffect(() => {
    if (analysis) {
      saveRecentAnalysis({
        id: analysis.id,
        scenarioId: analysis.scenario_id,
        scenarioTitle: analysis.scenario_title,
        pressingIntensity: analysis.pressing_intensity,
        status: analysis.status,
        createdAt: analysis.created_at,
      })
    }
  }, [analysis])

  const handleSelectPlayer = (player: Player, team: 'attacking' | 'defending') => {
    setSelectedPlayer(player)
    setSelectedTeam(team)
    setSelectedLane(null)
    setSelectedLaneIndex(null)
    setSelectedTrap(false)
    setSelectedCompactness(false)
  }

  const handleSelectLane = (lane: PassingLaneMetric, index: number) => {
    setSelectedLane(lane)
    setSelectedLaneIndex(index)
    setSelectedPlayer(null)
    setSelectedTeam(null)
    setSelectedTrap(false)
    setSelectedCompactness(false)
  }

  const handleSelectTrap = () => {
    setSelectedTrap(true)
    setSelectedPlayer(null)
    setSelectedTeam(null)
    setSelectedLane(null)
    setSelectedLaneIndex(null)
    setSelectedCompactness(false)
  }

  const handleSelectCompactness = () => {
    setSelectedCompactness(true)
    setSelectedPlayer(null)
    setSelectedTeam(null)
    setSelectedLane(null)
    setSelectedLaneIndex(null)
    setSelectedTrap(false)
  }

  const handleClearSelection = () => {
    setSelectedPlayer(null)
    setSelectedTeam(null)
    setSelectedLane(null)
    setSelectedLaneIndex(null)
    setSelectedTrap(false)
    setSelectedCompactness(false)
  }

  if (loadingAnalysis) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '96px 0', gap: '16px' }}>
        <LoadingSpinner size="lg" />
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Loading tactical analysis report and conversation history...
        </div>
      </div>
    )
  }

  if (analysisError || !analysis) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Link to="/history">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />}>
            Back to Archive
          </Button>
        </Link>
        <EmptyState
          icon={<History size={24} />}
          title="Analysis Not Found"
          description={analysisError?.message || `No tactical analysis record found matching ID ${id}.`}
          action={
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button variant="secondary" onClick={() => void refetchAnalysis()}>
                Retry
              </Button>
              <Link to="/analysis">
                <Button variant="primary">Start New Analysis</Button>
              </Link>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/history">
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />}>
              Archive
            </Button>
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Badge variant="pitch" icon={<ShieldCheck size={12} />}>
                Status: {analysis.status.toUpperCase()}
              </Badge>
              {analysis.pressing_intensity && (
                <Badge variant="danger">{analysis.pressing_intensity} Intensity</Badge>
              )}
            </div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {analysis.scenario_title}
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} />
            {new Date(analysis.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refetchAnalysis()}
            icon={<RefreshCw size={14} />}
            title="Refresh Analysis Record"
          />
          <Link to={`/analysis?scenario_id=${analysis.scenario_id}`}>
            <Button variant="primary" size="sm" icon={<Zap size={14} />}>
              Re-Analyze Scenario
            </Button>
          </Link>
        </div>
      </div>

      {/* 1. Plain-English Tactical Summary Hero Banner: Instant understanding for ordinary fans */}
      {analysis.analysis?.situation_overview && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderLeft: '4px solid var(--color-pitch)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--color-pitch)" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-pitch-light)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Tactical Situation at a Glance
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge variant="tactical">
                {analysis.analysis.situation_overview.match_phase?.replace(/_/g, ' ').toUpperCase() || 'IN POSSESSION'}
              </Badge>
              <Badge variant="default">
                {analysis.analysis.situation_overview.tactical_situation}
              </Badge>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>
            {analysis.analysis.situation_overview.summary}
          </p>
          {analysis.analysis.fan_watch_points?.tactical_takeaway && (
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{ color: 'var(--color-tactical-light)', fontWeight: 600 }}>Fan Takeaway:</span>
              <em style={{ color: 'var(--text-primary)' }}>&ldquo;{analysis.analysis.fan_watch_points.tactical_takeaway}&rdquo;</em>
            </div>
          )}
        </div>
      )}

      {/* Primary Pitch Visualizer with Interactive Selection & Plain-English Explainer */}
      {scenario ? (
        <Card>
          <CardHeader>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Badge variant="pitch" icon={<MousePointerClick size={12} />}>
                  Interactive Pitch
                </Badge>
                <Badge variant="tactical">Click to Inspect</Badge>
              </div>
              <CardTitle>
                Tactical Pitch &amp; Spatial Movements
              </CardTitle>
            </div>
            <Link to={`/scenarios/${scenario.id}`}>
              <Button variant="ghost" size="sm" icon={<Compass size={14} />}>
                Scenario Lineups
              </Button>
            </Link>
          </CardHeader>
          <CardContent style={{ padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <TacticalPitch
              attackingTeam={scenario.attacking_team}
              defendingTeam={scenario.defending_team}
              ballPosition={scenario.ball_position}
              spatialMetrics={analysis.spatial_metrics}
              showAnalysisOverlay={true}
              height="500px"
              selectedPlayerId={selectedPlayer?.id}
              onSelectPlayer={handleSelectPlayer}
              selectedLaneIndex={selectedLaneIndex}
              onSelectLane={handleSelectLane}
              selectedTrap={selectedTrap}
              onSelectTrap={handleSelectTrap}
              selectedCompactness={selectedCompactness}
              onSelectCompactness={handleSelectCompactness}
            />

            {/* Selection Explainer Below the Pitch */}
            <PitchSelectionExplainer
              selectedPlayer={selectedPlayer}
              selectedTeam={selectedTeam}
              attackingTeamName={scenario.attacking_team.name}
              defendingTeamName={scenario.defending_team.name}
              selectedLane={selectedLane}
              selectedTrap={selectedTrap}
              selectedCompactness={selectedCompactness}
              spatialMetrics={analysis.spatial_metrics}
              report={analysis.analysis}
              onClearSelection={handleClearSelection}
            />
          </CardContent>
        </Card>
      ) : loadingScenario ? (
        <Card>
          <CardContent style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
            <LoadingSpinner size="md" />
          </CardContent>
        </Card>
      ) : null}

      {/* View Tabs: Tactical Breakdown Report vs AI Follow-up Discussion */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-default)', paddingBottom: '8px' }}>
        <button
          type="button"
          className="pl-btn pl-btn-ghost pl-btn-sm"
          onClick={() => setActiveTab('report')}
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'report' ? 'var(--color-pitch-light)' : 'var(--text-secondary)',
            backgroundColor: activeTab === 'report' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
            border: activeTab === 'report' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
            padding: '6px 16px',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <FileText size={16} />
          <span>Fan Tactical Breakdown</span>
        </button>

        <button
          type="button"
          className="pl-btn pl-btn-ghost pl-btn-sm"
          onClick={() => setActiveTab('discussion')}
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'discussion' ? 'var(--color-tactical-light)' : 'var(--text-secondary)',
            backgroundColor: activeTab === 'discussion' ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
            border: activeTab === 'discussion' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
            padding: '6px 16px',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <MessageSquare size={16} />
          <span>Ask AI Follow-Up ({analysis.messages?.length || 0})</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'report' ? (
        <AnalysisReportView
          report={analysis.analysis}
          spatialMetrics={analysis.spatial_metrics}
          scenarioTitle={analysis.scenario_title}
        />
      ) : (
        <FollowUpConversation
          analysisId={analysis.id}
          initialMessages={analysis.messages || []}
          scenarioTitle={analysis.scenario_title}
        />
      )}
    </div>
  )
}
