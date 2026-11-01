import { type FC, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Compass,
  FileText,
  History,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
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
import { TacticalPitch } from '../../components/pitch/index.ts'
import { AnalysisReportView, FollowUpConversation } from '../../components/analysis/index.ts'
import { useApiQuery } from '../../hooks/useApi.ts'
import { analysisService } from '../../api/services/analysis.ts'
import { scenarioService } from '../../api/services/scenarios.ts'
import { saveRecentAnalysis } from '../../utils/recentAnalyses.ts'

export const AnalysisDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<'report' | 'discussion'>('report')

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

      {/* Primary Pitch Visualizer with AI Tactical Layer Overlay */}
      {scenario ? (
        <Card>
          <CardHeader>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Badge variant="pitch">Interactive Pitch</Badge>
                <Badge variant="tactical">Tactical Overlay Active</Badge>
              </div>
              <CardTitle>
                Spatial Relationships &amp; Pressing Direction
              </CardTitle>
            </div>
            <Link to={`/scenarios/${scenario.id}`}>
              <Button variant="ghost" size="sm" icon={<Compass size={14} />}>
                Scenario Lineups
              </Button>
            </Link>
          </CardHeader>
          <CardContent style={{ padding: '0 16px 16px 16px' }}>
            <TacticalPitch
              attackingTeam={scenario.attacking_team}
              defendingTeam={scenario.defending_team}
              ballPosition={scenario.ball_position}
              spatialMetrics={analysis.spatial_metrics}
              showAnalysisOverlay={true}
              height="500px"
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

      {/* View Tabs: 10-Section Structured Report vs Contextual Discussion */}
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
          <span>Full 10-Section Tactical Report</span>
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
          <span>Follow-Up Discussion ({analysis.messages?.length || 0})</span>
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
