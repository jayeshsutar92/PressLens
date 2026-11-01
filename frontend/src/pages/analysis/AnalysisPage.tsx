import { type FC, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Compass,
  Cpu,
  HelpCircle,
  Layers,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
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
import { useApiQuery } from '../../hooks/useApi.ts'
import { scenarioService } from '../../api/services/scenarios.ts'
import { analysisService } from '../../api/services/analysis.ts'
import { saveRecentAnalysis } from '../../utils/recentAnalyses.ts'
import type { ScenarioSummary } from '../../types/scenario.ts'

const SUGGESTED_QUERIES = [
  'How does the defending team coordinate cover shadows to funnel play wide?',
  'What triggers initiate the high press and who leads the first defensive wave?',
  'Analyze the rest-defense compactness and vulnerable spaces behind the block.',
  'What passing options are trapped vs open for the ball carrier?',
]

const FOCUS_AREA_OPTIONS = [
  { id: 'cover_shadows', label: 'Cover Shadows' },
  { id: 'triggers', label: 'Pressing Triggers' },
  { id: 'passing_lanes', label: 'Passing Lanes' },
  { id: 'rest_defense', label: 'Rest-Defense' },
  { id: 'compactness', label: 'Block Compactness' },
]

export const AnalysisPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const scenarioIdParam = searchParams.get('scenario_id')

  const [userSelectedScenarioId, setUserSelectedScenarioId] = useState<string | null>(null)
  const [userQuery, setUserQuery] = useState('')
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const { data: scenarios, isLoading: loadingScenarios } = useApiQuery(
    () => scenarioService.getScenarios(),
    [],
  )

  const selectedScenarioId =
    userSelectedScenarioId ||
    (scenarioIdParam && scenarios?.some((s) => s.id === scenarioIdParam) ? scenarioIdParam : '') ||
    (scenarios && scenarios.length > 0 ? scenarios[0].id : '')

  const { data: selectedScenario, isLoading: loadingSelectedScenario } = useApiQuery(
    () =>
      selectedScenarioId
        ? scenarioService.getScenarioById(selectedScenarioId)
        : Promise.resolve(null),
    [selectedScenarioId],
    { enabled: Boolean(selectedScenarioId) },
  )

  const handleScenarioChange = (id: string) => {
    setUserSelectedScenarioId(id)
    setSearchParams({ scenario_id: id })
  }

  const toggleFocusArea = (id: string) => {
    setSelectedFocusAreas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleStartAnalysis = async () => {
    if (!selectedScenarioId || isAnalyzing) return

    setIsAnalyzing(true)
    setAnalysisError(null)

    try {
      const result = await analysisService.createAnalysis({
        scenario_id: selectedScenarioId,
        user_query: userQuery.trim() || undefined,
        focus_areas: selectedFocusAreas.length > 0 ? selectedFocusAreas : undefined,
      })

      // Archive in recent analyses
      saveRecentAnalysis({
        id: result.id,
        scenarioId: result.scenario_id,
        scenarioTitle: result.scenario_title,
        userQuery: userQuery.trim() || undefined,
        pressingIntensity: result.pressing_intensity,
        status: result.status,
        createdAt: result.created_at,
      })

      // Navigate to detailed report & conversation view
      navigate(`/analysis/${result.id}`)
    } catch (err) {
      setAnalysisError(
        err instanceof Error ? err.message : 'An error occurred during agent analysis execution.',
      )
      setIsAnalyzing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            AI Tactical Analysis Studio
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Single-agent orchestrator grounded with Groq Llama 3.3, deterministic geometry, and PostgreSQL RAG.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/history">
            <Button variant="secondary" size="sm">
              Session Archive
            </Button>
          </Link>
          <Link to="/scenarios/builder">
            <Button variant="outline" size="sm" icon={<Compass size={14} />}>
              Build Custom Scenario
            </Button>
          </Link>
        </div>
      </div>

      {loadingScenarios ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : !scenarios || scenarios.length === 0 ? (
        <EmptyState
          icon={<Compass size={24} />}
          title="No Scenarios Available"
          description="Create or seed match scenarios in PostgreSQL to initiate AI tactical analysis."
          action={
            <Link to="/scenarios/builder">
              <Button variant="primary">Create Scenario</Button>
            </Link>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(320px, 1.8fr)', gap: '24px', alignItems: 'start' }}>
          {/* Left Column: Scenario Selector & Prompt Engine */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Scenario Dropdown Card */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Layers size={18} color="var(--color-pitch)" />
                  Select Match Scenario
                </CardTitle>
                <Badge variant="tactical">{scenarios.length} Available</Badge>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label htmlFor="scenario-select" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Tactical Setup:
                  </label>
                  <select
                    id="scenario-select"
                    className="pl-input"
                    value={selectedScenarioId}
                    onChange={(e) => handleScenarioChange(e.target.value)}
                    disabled={isAnalyzing}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--bg-canvas)',
                      cursor: 'pointer',
                    }}
                  >
                    {scenarios.map((s: ScenarioSummary) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.match_phase.replace('_', ' ')})
                      </option>
                    ))}
                  </select>

                  {selectedScenario?.description && (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '4px' }}>
                      {selectedScenario.description}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tactical Query Formulation */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Sparkles size={18} color="var(--color-tactical)" />
                  Formulate Tactical Inquiry
                </CardTitle>
                <Badge variant="default">Fan-Focused</Badge>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Custom Prompt Input */}
                  <div>
                    <label htmlFor="user-query-input" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Specific Question (Optional):
                    </label>
                    <textarea
                      id="user-query-input"
                      className="pl-input"
                      rows={3}
                      placeholder="e.g. How does the pressing team cut off the central passing lanes and force the ball into the touchline trap?"
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      disabled={isAnalyzing}
                      style={{
                        width: '100%',
                        resize: 'vertical',
                        backgroundColor: 'var(--bg-canvas)',
                        lineHeight: 1.5,
                      }}
                    />
                  </div>

                  {/* Preset Question Chips */}
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                      QUICK FAN INQUIRIES:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {SUGGESTED_QUERIES.map((q) => (
                        <button
                          key={q}
                          type="button"
                          className="pl-btn pl-btn-ghost pl-btn-sm"
                          onClick={() => setUserQuery(q)}
                          disabled={isAnalyzing}
                          style={{
                            textAlign: 'left',
                            justifyContent: 'flex-start',
                            fontSize: '0.8125rem',
                            padding: '6px 10px',
                            backgroundColor: userQuery === q ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-canvas)',
                            border: userQuery === q ? '1px solid var(--color-tactical)' : '1px solid var(--border-subtle)',
                            color: userQuery === q ? 'var(--color-tactical-light)' : 'var(--text-secondary)',
                            borderRadius: 'var(--radius-md)',
                            lineHeight: 1.4,
                          }}
                        >
                          <HelpCircle size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{q}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Focus Areas */}
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                      PRIORITIZE TACTICAL FOCUS AREAS:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {FOCUS_AREA_OPTIONS.map((f) => {
                        const active = selectedFocusAreas.includes(f.id)
                        return (
                          <button
                            key={f.id}
                            type="button"
                            className="pl-btn pl-btn-ghost pl-btn-sm"
                            onClick={() => toggleFocusArea(f.id)}
                            disabled={isAnalyzing}
                            style={{
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.75rem',
                              padding: '4px 10px',
                              backgroundColor: active ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-canvas)',
                              border: active ? '1px solid var(--color-pitch)' : '1px solid var(--border-default)',
                              color: active ? 'var(--color-pitch-light)' : 'var(--text-muted)',
                            }}
                          >
                            {active ? '✓ ' : '+ '}
                            {f.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {analysisError && (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        fontSize: '0.8125rem',
                        lineHeight: 1.5,
                      }}
                    >
                      {analysisError}
                    </div>
                  )}

                  {/* Submit Action */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      onClick={() => void handleStartAnalysis()}
                      disabled={isAnalyzing || !selectedScenarioId}
                      icon={isAnalyzing ? <LoadingSpinner size="sm" /> : <Play size={16} />}
                      style={{ flex: 1 }}
                    >
                      {isAnalyzing ? 'Running Tactical Orchestrator...' : 'Initiate AI Analysis'}
                    </Button>

                    {userQuery && !isAnalyzing && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="md"
                        onClick={() => setUserQuery('')}
                        icon={<RotateCcw size={14} />}
                        title="Clear query"
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Zero-Hallucination & Architecture Assurance */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <ShieldCheck size={22} color="var(--color-pitch)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Coordinates and pressing vectors are deterministically validated before passing to Groq LLM and PostgreSQL RAG.
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Pitch Inspection of Selected Scenario */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loadingSelectedScenario ? (
              <Card>
                <CardContent style={{ padding: '64px', display: 'flex', justifyContent: 'center' }}>
                  <LoadingSpinner size="md" />
                </CardContent>
              </Card>
            ) : selectedScenario ? (
              <Card>
                <CardHeader>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Badge variant="pitch">Pitch Inspection</Badge>
                      <Badge variant="tactical">
                        {selectedScenario.match_phase.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardTitle>{selectedScenario.title}</CardTitle>
                  </div>
                  <Link to={`/scenarios/${selectedScenario.id}`}>
                    <Button variant="ghost" size="sm">
                      Inspect Details
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent style={{ padding: '0 16px 16px 16px' }}>
                  <TacticalPitch
                    attackingTeam={selectedScenario.attacking_team}
                    defendingTeam={selectedScenario.defending_team}
                    ballPosition={selectedScenario.ball_position}
                    height="460px"
                  />
                  <div
                    style={{
                      marginTop: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8125rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>
                      Situation: <strong style={{ color: 'var(--text-primary)' }}>{selectedScenario.tactical_situation}</strong>
                    </span>
                    <span>
                      Build-up: <strong style={{ color: '#38bdf8' }}>{selectedScenario.attacking_team.formation}</strong> vs Press: <strong style={{ color: '#10b981' }}>{selectedScenario.defending_team.formation}</strong>
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Report Highlights Guide */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Cpu size={18} color="var(--color-pitch)" />
                  What You Will Receive
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-canvas)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                      10-Section AI Dissection
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Situation overview, triggers, cover shadows, vulnerabilities, and watch points.
                    </div>
                  </div>

                  <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-canvas)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                      Tactical Pitch Overlays
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Pressing vectors, passing lanes (open/contested/blocked), and compactness boxes.
                    </div>
                  </div>

                  <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-canvas)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                      Grounded Citations
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Exact literature and coaching manual references with semantic relevance scores.
                    </div>
                  </div>

                  <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-canvas)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                      Interactive Follow-Up Q&amp;A
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Ask continuous questions while preserving full scenario spatial state.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
