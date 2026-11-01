import { type FC } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Compass,
  Cpu,
  Layers,
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
  Input,
} from '../../components/common/index.ts'
import { useApiQuery } from '../../hooks/useApi.ts'
import { scenarioService } from '../../api/services/scenarios.ts'

export const AnalysisPage: FC = () => {
  const [searchParams] = useSearchParams()
  const scenarioIdParam = searchParams.get('scenario_id')

  const { data: scenarios } = useApiQuery(
    () => scenarioService.getScenarios(),
    [],
  )

  const selectedScenario = scenarios?.find((s) => s.id === scenarioIdParam)

  const analysisPillars = [
    { title: 'Situation Overview', desc: 'Phase, team formations, and active ball zone coordinates.' },
    { title: 'Pressing Strategy', desc: 'Core defensive philosophy, funneling vector, and intensity rating.' },
    { title: 'Pressing Triggers', desc: 'Visual cues, body shape triggers, and coordinated trap setups.' },
    { title: 'Passing Lane Coverage', desc: 'Active cover shadows cast, blocked options, and escape routes.' },
    { title: 'Exposed Spaces', desc: 'Weak-side vulnerabilities and defensive line height trade-offs.' },
    { title: 'Fan Watch Points', desc: 'Key individual duels and decisive movements for ordinary fans.' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Tactical Analysis Engine
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Single-agent orchestrator powered by Groq Llama 3.3, spatial geometry, and PostgreSQL RAG.
          </p>
        </div>
        <Link to="/history">
          <Button variant="secondary" size="sm">
            View History
          </Button>
        </Link>
      </div>

      {/* Selected Scenario Context */}
      <Card>
        <CardHeader>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Badge variant={selectedScenario ? 'pitch' : 'default'}>
                {selectedScenario ? 'Selected Scenario' : 'Default Context'}
              </Badge>
              {selectedScenario && (
                <Badge variant="tactical">{selectedScenario.match_phase.replace('_', ' ')}</Badge>
              )}
            </div>
            <CardTitle>
              {selectedScenario ? selectedScenario.title : 'Select a Scenario for Detailed AI Dissection'}
            </CardTitle>
          </div>
          <Link to="/scenarios">
            <Button variant="outline" size="sm" icon={<Compass size={14} />}>
              {selectedScenario ? 'Change Scenario' : 'Browse Scenarios'}
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Custom Tactical Inquiry (Optional)"
              placeholder="e.g. How does the ball-near winger utilize their cover shadow to trap the fullback?"
              disabled
            />

            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Cpu size={18} color="var(--color-pitch)" />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  Tactical agent orchestrator ready on backend endpoint <code>POST /api/v1/analysis</code>
                </span>
              </div>
              <Button variant="primary" size="sm" icon={<Zap size={14} />} disabled>
                Run Tactical Analysis
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Structure Architecture */}
      <div>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="var(--color-tactical)" />
          Structured 10-Section AI Report Architecture
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          {analysisPillars.map((pillar) => (
            <Card key={pillar.title}>
              <CardContent style={{ padding: '20px' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {pillar.title}
                </div>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {pillar.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Grounding Info */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <ShieldCheck size={24} color="var(--color-pitch)" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
            Zero-Hallucination Policy
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Every tactical deduction is anchored to verified coordinates calculated by Python spatial tools and grounded in curated literature.
          </div>
        </div>
      </div>
    </div>
  )
}
