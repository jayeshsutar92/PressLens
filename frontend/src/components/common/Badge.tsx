import { type FC, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils/helpers.ts'

export type BadgeVariant = 'default' | 'pitch' | 'tactical' | 'warning' | 'danger'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  icon?: ReactNode
}

export const Badge: FC<BadgeProps> = ({
  variant = 'default',
  icon,
  className,
  children,
  ...props
}) => {
  return (
    <span className={cn('pl-badge', `pl-badge-${variant}`, className)} {...props}>
      {icon && <span className="pl-badge-icon">{icon}</span>}
      {children}
    </span>
  )
}
