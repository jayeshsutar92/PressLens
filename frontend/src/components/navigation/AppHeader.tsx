import { type FC } from 'react'
import { Sparkles, Terminal } from 'lucide-react'
import { StatusIndicator } from '../common/StatusIndicator.tsx'
import { useHealthCheck } from '../../hooks/useHealthCheck.ts'

export const AppHeader: FC = () => {
  const { isHealthy, isChecking } = useHealthCheck(20000)

  const status = isChecking
    ? 'checking'
    : isHealthy === true
      ? 'connected'
      : isHealthy === false
        ? 'disconnected'
        : 'checking'

  return (
    <header className="pl-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
          }}
        >
          <Terminal size={14} color="var(--color-pitch)" />
          <span style={{ fontFamily: 'var(--font-mono)' }}>FastAPI Engine v0.2.0</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <StatusIndicator status={status} />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            padding: '4px 8px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--color-pitch-light)',
          }}
        >
          <Sparkles size={12} />
          <span>Groq AI + PostgreSQL RAG</span>
        </div>
      </div>
    </header>
  )
}
