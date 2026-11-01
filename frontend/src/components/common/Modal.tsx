import { type FC, type ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button.tsx'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

export const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="pl-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="pl-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="pl-modal-header">
          <div>
            {title && (
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {title}
              </h3>
            )}
            {description && (
              <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {description}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close dialog"
            style={{ padding: '6px', height: '32px', width: '32px' }}
          >
            <X size={18} />
          </Button>
        </div>

        <div className="pl-modal-body">{children}</div>

        {footer && <div className="pl-modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
