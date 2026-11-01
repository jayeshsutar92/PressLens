import { type FC } from 'react'
import { cn } from '../../utils/helpers.ts'

export interface StatusIndicatorProps {
  status: 'connected' | 'disconnected' | 'checking' | 'warning'
  label?: string
  className?: string
}

export const StatusIndicator: FC<StatusIndicatorProps> = ({ status, label, className }) => {
  const colorMap = {
    connected: 'var(--color-pitch)',
    disconnected: 'var(--color-danger)',
    checking: 'var(--color-warning)',
    warning: 'var(--color-warning)',
  }

  const defaultLabelMap = {
    connected: 'API Connected',
    disconnected: 'API Offline',
    checking: 'Connecting...',
    warning: 'Degraded',
  }

  const dotColor = colorMap[status]
  const displayLabel = label || defaultLabelMap[status]

  return (
    <div
      className={cn('pl-status-indicator', className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.8125rem',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <span
        style={{
          position: 'relative',
          display: 'flex',
          height: '8px',
          width: '8px',
        }}
      >
        {status === 'connected' && (
          <span
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '9999px',
              backgroundColor: dotColor,
              opacity: 0.75,
              animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
            }}
          />
        )}
        <span
          style={{
            position: 'relative',
            display: 'inline-flex',
            borderRadius: '9999px',
            height: '8px',
            width: '8px',
            backgroundColor: dotColor,
          }}
        />
      </span>
      <span>{displayLabel}</span>
      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
