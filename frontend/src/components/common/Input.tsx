import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils/helpers.ts'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, id, className, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="pl-field-group">
        {label && (
          <label htmlFor={inputId} className="pl-label">
            {label}
          </label>
        )}
        <div className="pl-input-wrapper">
          {icon && (
            <span
              style={{
                position: 'absolute',
                left: '12px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn('pl-input', error && 'pl-input-error', className)}
            style={icon ? { paddingLeft: '38px' } : undefined}
            {...props}
          />
        </div>
        {error && <span className="pl-error-text">{error}</span>}
        {!error && helperText && <span className="pl-helper-text">{helperText}</span>}
      </div>
    )
  },
)

Input.displayName = 'Input'
