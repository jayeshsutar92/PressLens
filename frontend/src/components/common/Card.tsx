import { type FC, forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../utils/helpers.ts'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ interactive = false, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('pl-card', interactive && 'pl-card-interactive', className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)

Card.displayName = 'Card'

export const CardHeader: FC<HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('pl-card-header', className)} {...props}>
    {children}
  </div>
)

export const CardTitle: FC<HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => (
  <h3 className={cn('pl-card-title', className)} {...props}>
    {children}
  </h3>
)

export const CardDescription: FC<HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => (
  <p className={cn('pl-card-description', className)} {...props}>
    {children}
  </p>
)

export const CardContent: FC<HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('pl-card-content', className)} {...props}>
    {children}
  </div>
)

export const CardFooter: FC<HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('pl-card-footer', className)} {...props}>
    {children}
  </div>
)
