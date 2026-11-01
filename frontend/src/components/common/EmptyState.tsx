import { type FC, type ReactNode } from 'react'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export const EmptyState: FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        border: '1px dashed var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'rgba(255, 255, 255, 0.01)',
      }}
    >
      {icon && (
        <div
          style={{
            marginBottom: '16px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-elevated)',
          }}
        >
          {icon}
        </div>
      )}
      <h4 style={{ margin: '0 0 8px 0', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
        {title}
      </h4>
      <p style={{ margin: '0 0 20px 0', fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '420px' }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  )
}
