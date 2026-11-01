import { type FC, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Compass, Filter, Plus, Shield, Zap } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  EmptyState,
  LoadingSpinner,
} from '../../components/common/index.ts'
import { useApiQuery } from '../../hooks/useApi.ts'
import { scenarioService } from '../../api/services/scenarios.ts'
import { formatDate, formatMatchPhase } from '../../utils/formatters.ts'

export const ScenariosPage: FC = () => {
  const navigate = useNavigate()
  const [selectedPhase, setSelectedPhase] = useState<string>('all')

  const { data: scenarios, isLoading, error, refetch } = useApiQuery(
    () =>
      scenarioService.getScenarios({
        match_phase: selectedPhase === 'all' ? undefined : selectedPhase,
      }),
    [selectedPhase],
  )

  const phaseFilters = [
    { id: 'all', label: 'All Phases' },
    { id: 'high_press', label: 'High Press' },
    { id: 'counter_press', label: 'Counter-Press' },
    { id: 'mid_block', label: 'Mid Block' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Match Scenarios
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Select a match situation to launch deep tactical pressing and spatial analysis.
          </p>
        </div>
        <Link to="/scenarios/builder">
          <Button variant="primary" icon={<Plus size={16} />}>
            Create Scenario
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-muted)', marginRight: '8px' }}>
          <Filter size={14} /> Filter by Phase:
        </span>
        {phaseFilters.map((tab) => (
          <Button
            key={tab.id}
            variant={selectedPhase === tab.id ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedPhase(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Scenarios Grid */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <EmptyState
          icon={<Shield size={24} />}
          title="Failed to Load Scenarios"
          description={error.message || 'Could not connect to backend service.'}
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        />
      ) : scenarios && scenarios.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '20px',
          }}
        >
          {scenarios.map((scenario) => (
            <Card key={scenario.id} interactive onClick={() => navigate(`/scenarios/${scenario.id}`)}>
              <CardHeader>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Badge variant={scenario.is_prepared ? 'pitch' : 'default'}>
                      {scenario.is_prepared ? 'Prepared' : 'Custom'}
                    </Badge>
                    <Badge variant="tactical">{formatMatchPhase(scenario.match_phase)}</Badge>
                  </div>
                  <CardTitle>{scenario.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription style={{ color: 'var(--text-secondary)', lineHeight: 1.5, minHeight: '44px' }}>
                  {scenario.tactical_situation}
                </CardDescription>
                <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Created: {formatDate(scenario.created_at)}
                </div>
              </CardContent>
              <CardFooter>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Status: Active</span>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Zap size={14} />}
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/scenarios/${scenario.id}`)
                  }}
                >
                  Inspect Pitch
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Compass size={24} />}
          title="No Scenarios Found"
          description="No scenarios match the selected filter. Try choosing another phase or create a new custom scenario."
          action={
            <Link to="/scenarios/builder">
              <Button variant="primary" icon={<Plus size={16} />}>
                Create Custom Scenario
              </Button>
            </Link>
          }
        />
      )}
    </div>
  )
}

