import { type FC, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  FileText,
  History,
  Info,
  Trash2,
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
  EmptyState,
} from '../../components/common/index.ts'
import {
  type RecentAnalysisItem,
  getRecentAnalyses,
  removeRecentAnalysis,
} from '../../utils/recentAnalyses.ts'

export const HistoryPage: FC = () => {
  const [sessions, setSessions] = useState<RecentAnalysisItem[]>(() => getRecentAnalyses())

  const handleRemove = (id: string) => {
    removeRecentAnalysis(id)
    setSessions(getRecentAnalyses())
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Analysis Session Archive
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Review and revisit previously generated AI tactical reports and conversational follow-ups.
          </p>
        </div>

        <Link to="/analysis">
          <Button variant="primary" icon={<Zap size={14} />}>
            New Tactical Analysis
          </Button>
        </Link>
      </div>

      {/* Backend Endpoint Grounding Notice */}
      <div
        style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Info size={18} color="var(--color-tactical)" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong>Architecture Note:</strong> A global list endpoint (e.g. <code>GET /api/v1/analysis</code>) is not implemented in the current backend.
          Your analyzed sessions are indexed locally, and clicking any record re-fetches the complete report and all message turns from PostgreSQL via <code>GET /api/v1/analysis/{'{id}'}</code>.
        </div>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <History size={18} color="var(--color-pitch)" />
              Recent Sessions
            </CardTitle>
            <CardDescription>Sessions stored in PostgreSQL</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<History size={24} />}
              title="No Analysis Sessions Recorded Yet"
              description="When you initiate an AI tactical analysis on a match scenario, it will be archived here for instant revisiting."
              action={
                <Link to="/analysis">
                  <Button variant="primary" icon={<Zap size={14} />}>
                    Start First Analysis
                  </Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {sessions.length} {sessions.length === 1 ? 'Archived Session' : 'Archived Sessions'}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '16px',
            }}
          >
            {sessions.map((session) => (
              <Card key={session.id} style={{ display: 'flex', flexDirection: 'column' }}>
                <CardHeader>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Badge variant="pitch">{session.status.toUpperCase()}</Badge>
                      {session.pressingIntensity && (
                        <Badge variant="tactical">{session.pressingIntensity}</Badge>
                      )}
                    </div>
                    <CardTitle style={{ fontSize: '1.0625rem' }}>
                      {session.scenarioTitle}
                    </CardTitle>
                  </div>
                  <button
                    type="button"
                    className="pl-btn pl-btn-ghost pl-btn-sm"
                    onClick={() => handleRemove(session.id)}
                    style={{ color: 'var(--text-dim)', padding: '4px' }}
                    title="Remove from local history"
                  >
                    <Trash2 size={14} />
                  </button>
                </CardHeader>
                <CardContent style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
                  {session.userQuery ? (
                    <div
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary)',
                        fontStyle: 'italic',
                        lineHeight: 1.5,
                        backgroundColor: 'var(--bg-canvas)',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        borderLeft: '3px solid var(--color-tactical)',
                      }}
                    >
                      &ldquo;{session.userQuery}&rdquo;
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      Standard tactical pressing dissection.
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-subtle)',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      {new Date(session.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>

                    <Link to={`/analysis/${session.id}`}>
                      <Button variant="outline" size="sm" icon={<FileText size={14} />}>
                        Reopen Report
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
