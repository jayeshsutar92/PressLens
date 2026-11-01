import { type FC } from 'react'
import { BookOpen, ExternalLink, ShieldCheck } from 'lucide-react'
import type { SourceCitation } from '../../types/analysis.ts'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '../common/index.ts'

export interface KnowledgeSourcesCardProps {
  sources: SourceCitation[]
  title?: string
  description?: string
}

export const KnowledgeSourcesCard: FC<KnowledgeSourcesCardProps> = ({
  sources,
  title = 'Verified Tactical Knowledge Sources',
  description = 'Literature and coaching manuals retrieved to ground this analysis with zero hallucination.',
}) => {
  if (!sources || sources.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>
            <BookOpen size={18} color="var(--color-pitch)" />
            {title}
          </CardTitle>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {description}
          </span>
        </div>
        <Badge variant="pitch" icon={<ShieldCheck size={12} />}>
          {sources.length} {sources.length === 1 ? 'Source' : 'Sources'} Cited
        </Badge>
      </CardHeader>
      <CardContent>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {sources.map((source, idx) => {
            const similarityPercent = Math.round(source.relevance_score * 100)

            return (
              <div
                key={`${source.document_title}-${idx}`}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-default)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'border-color var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {source.document_title}
                  </div>
                  <Badge variant={similarityPercent >= 75 ? 'tactical' : 'default'} size="sm">
                    {similarityPercent}% match
                  </Badge>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {source.author && (
                    <div>
                      <strong style={{ color: 'var(--text-muted)' }}>Author / Body:</strong> {source.author}
                    </div>
                  )}
                  {source.publication && (
                    <div>
                      <strong style={{ color: 'var(--text-muted)' }}>Publication:</strong> {source.publication}
                    </div>
                  )}
                  <div>
                    <strong style={{ color: 'var(--text-muted)' }}>Topic:</strong>{' '}
                    <span style={{ textTransform: 'capitalize' }}>{source.topic.replace('_', ' ')}</span>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ExternalLink size={12} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    Grounded via PostgreSQL vector similarity
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
