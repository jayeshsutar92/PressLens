import { type FC } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BookOpen,
  Compass,
  PlusCircle,
  Shield,
  Zap,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  LoadingSpinner,
} from '../../components/common/index.ts'
import { useApiQuery } from '../../hooks/useApi.ts'
import { scenarioService } from '../../api/services/scenarios.ts'
import { knowledgeService } from '../../api/services/knowledge.ts'

export const DashboardPage: FC = () => {
  const { data: scenarios, isLoading: loadingScenarios } = useApiQuery(
    () => scenarioService.getScenarios({ limit: 4 }),
    [],
  )

  const { data: topics, isLoading: loadingTopics } = useApiQuery(
    () => knowledgeService.getTopics(),
    [],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Hero Banner */}
      <div
        style={{
          padding: '36px',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(9, 13, 22, 0.95) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Badge variant="pitch" icon={<Zap size={12} />}>
              Tactical Analysis Engine
            </Badge>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Football Intelligence Grounded in Spatial Science
            </span>
          </div>
          <h2
            style={{
              margin: '0 0 12px 0',
              fontSize: '2rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            Welcome to PressLens
          </h2>
          <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Analyze pressing mechanisms, evaluate cover shadows, and dissect defensive transitions.
            PressLens combines deterministic spatial pitch geometry with curated football theoretical literature.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/scenarios">
            <Button variant="primary" size="lg" icon={<Compass size={18} />}>
              Explore Scenarios
            </Button>
          </Link>
          <Link to="/analysis">
            <Button variant="secondary" size="lg" icon={<Activity size={18} />}>
              Tactical AI Analysis
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
        }}
      >
        <Card>
          <CardContent style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Available Scenarios
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {loadingScenarios ? <LoadingSpinner size="sm" /> : scenarios?.length ?? 0}
                </div>
              </div>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-pitch)',
                }}
              >
                <Compass size={22} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Curated Tactical Topics
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {loadingTopics ? <LoadingSpinner size="sm" /> : topics?.length ?? 0}
                </div>
              </div>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-tactical)',
                }}
              >
                <BookOpen size={22} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  AI Analysis Models
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  Llama 3.3 70B
                </div>
              </div>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-warning)',
                }}
              >
                <Shield size={22} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Scenarios & Tactical Pillars */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Scenarios Preview */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>
                <Compass size={18} color="var(--color-pitch)" />
                Prepared Match Scenarios
              </CardTitle>
              <CardDescription>Curated pressing situations ready for interactive analysis</CardDescription>
            </div>
            <Link to="/scenarios">
              <Button variant="ghost" size="sm" icon={<ArrowRight size={14} />} iconPosition="right">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingScenarios ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                <LoadingSpinner />
              </div>
            ) : scenarios && scenarios.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {scenarios.slice(0, 3).map((scenario) => (
                  <Link
                    key={scenario.id}
                    to={`/scenarios/${scenario.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        transition: 'border-color var(--transition-fast)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-pitch)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {scenario.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {scenario.tactical_situation}
                        </div>
                      </div>
                      <Badge variant="pitch">
                        {scenario.match_phase.replace('_', ' ')}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                No scenarios found. Start the backend service to seed prepared scenarios.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tactical Knowledge Pillars */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>
                <BookOpen size={18} color="var(--color-tactical)" />
                Curated Tactical Principles
              </CardTitle>
              <CardDescription>Grounded concepts indexed in the vector knowledge base</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loadingTopics ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                <LoadingSpinner />
              </div>
            ) : topics && topics.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topics.slice(0, 4).map((topic) => (
                  <div
                    key={topic.topic}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {topic.topic.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <Badge variant="tactical">
                        {topic.document_count} docs
                      </Badge>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {topic.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                Knowledge topics will load automatically from PostgreSQL.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Action Bar */}
      <Card>
        <CardContent style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Ready to construct a tactical situation?
            </h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Set up customized team formations, player roles, and ball coordinates in the Scenario Builder.
            </p>
          </div>
          <Link to="/scenarios/builder">
            <Button variant="outline" icon={<PlusCircle size={16} />}>
              Open Scenario Builder
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

