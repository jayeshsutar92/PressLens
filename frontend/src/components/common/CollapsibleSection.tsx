import { type FC, type ReactNode, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader } from './Card.tsx'
import { Badge, type BadgeVariant } from './Badge.tsx'

export interface SummaryBadgeItem {
  label: string
  variant?: BadgeVariant
}

export interface CollapsibleSectionProps {
  id?: string
  title: string
  subtitle?: string
  icon?: ReactNode
  badge?: ReactNode
  summaryBadges?: SummaryBadgeItem[]
  defaultOpen?: boolean
  children: ReactNode
  className?: string
}

export const CollapsibleSection: FC<CollapsibleSectionProps> = ({
  id,
  title,
  subtitle,
  icon,
  badge,
  summaryBadges,
  defaultOpen = false,
  children,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen)

  return (
    <Card id={id} className={className}>
      <CardHeader
        style={{
          cursor: 'pointer',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
        }}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {title}
              </span>
              {badge}
              {summaryBadges &&
                summaryBadges.map((sb, idx) => (
                  <Badge key={idx} variant={sb.variant || 'default'} size="sm">
                    {sb.label}
                  </Badge>
                ))}
            </div>
            {subtitle && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                {subtitle}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>
            {isOpen ? 'Collapse' : 'Expand Details'}
          </span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
          {children}
        </CardContent>
      )}
    </Card>
  )
}
