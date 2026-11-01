import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react'
import { LoadingSpinner } from './LoadingSpinner.tsx'
import { cn } from '../../utils/helpers.ts'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  isLoading?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      icon,
      iconPosition = 'left',
      isLoading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const isActuallyDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        disabled={isActuallyDisabled}
        className={cn(
          'pl-btn',
          `pl-btn-${variant}`,
          `pl-btn-${size}`,
          fullWidth && 'w-full',
          isActuallyDisabled && 'is-disabled',
          className,
        )}
        style={fullWidth ? { width: '100%' } : undefined}
        {...props}
      >
        {isLoading && <LoadingSpinner size={size === 'lg' ? 'md' : 'sm'} />}
        {!isLoading && icon && iconPosition === 'left' && <span className="pl-btn-icon">{icon}</span>}
        {children && <span>{children}</span>}
        {!isLoading && icon && iconPosition === 'right' && <span className="pl-btn-icon">{icon}</span>}
      </button>
    )
  },
)

Button.displayName = 'Button'
