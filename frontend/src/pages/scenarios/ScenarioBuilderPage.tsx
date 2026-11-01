import { type FC } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Compass, Info, PenTool } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '../../components/common/index.ts'

export const ScenarioBuilderPage: FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Navigation Back */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/scenarios">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />}>
            Back to Scenarios
          </Button>
        </Link>
        <Badge variant="tactical" icon={<PenTool size={12} />}>
          Builder Workspace
        </Badge>
      </div>

      {/* Header */}
      <div>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Scenario Builder
        </h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Configure custom tactical setups, team formations, and initial player coordinates.
        </p>
      </div>

      {/* Notice Banner */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <Info size={18} color="var(--color-tactical-light)" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
            Interactive Pitch Editor Placeholder
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            The 2D interactive tactical board with drag-and-drop player positioning, passing lane overlays,
            and ball placement controls will be integrated in the upcoming tactical interface release.
          </div>
        </div>
      </div>

      {/* Form Blueprint Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Scenario Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Scenario Metadata</CardTitle>
            <CardDescription>Core details defining the match situation</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              label="Scenario Title"
              placeholder="e.g. Arsenal 4-2-3-1 High Press vs Build-up"
              disabled
            />
            <Input
              label="Tactical Situation"
              placeholder="e.g. Build-up obstruction on defensive right flank"
              disabled
            />
            <div className="pl-field-group">
              <label className="pl-label">Match Phase</label>
              <select
                className="pl-input"
                disabled
                style={{ cursor: 'not-allowed', color: 'var(--text-dim)' }}
              >
                <option>High Press</option>
                <option>Counter-Press (Gegenpress)</option>
                <option>Mid-Block Transition</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Pitch Area Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Tactical Pitch Board</CardTitle>
            <CardDescription>105m &times; 68m normalized pitch canvas</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              style={{
                height: '240px',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-default)',
                backgroundColor: 'rgba(16, 185, 129, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '24px',
              }}
            >
              <Compass size={32} color="var(--color-pitch)" style={{ marginBottom: '12px' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Pitch Canvas Ready
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '300px' }}>
                Tactical canvas coordinate engine will render player coordinates and pressing vectors here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
