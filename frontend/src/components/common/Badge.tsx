import { type FC, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils/helpers.ts'

export type BadgeVariant = 'default' | 'pitch' | 'tactical' | 'warning' | 'danger'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
}

export const Badge: FC<BadgeProps> = ({
  variant = 'default',
  size,
  icon,
  className,
  children,
  style,
  ...props
}) => {
  const sizeStyles =
    size === 'sm'
      ? { padding: '1px 6px', fontSize: '0.6875rem' }
      : size === 'lg'
        ? { padding: '4px 12px', fontSize: '0.8125rem' }
        : undefined

  return (
    <span
      className={cn('pl-badge', `pl-badge-${variant}`, className)}
      style={{ ...sizeStyles, ...style }}
      {...props}
    >
      {icon && <span className="pl-badge-icon">{icon}</span>}
      {children}
    </span>
  )
}
