import { type FC } from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  color?: string
}

export const LoadingSpinner: FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  color = 'currentColor',
}) => {
  const pixelSize = size === 'sm' ? 16 : size === 'lg' ? 32 : 24

  return (
    <svg
      className={`pl-spinner ${className}`}
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        animation: 'spin 0.8s linear infinite',
      }}
      aria-label="Loading"
      role="status"
    >
      <style>
        {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
      </style>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  )
}
