export interface ResponseEnvelope<T> {
  status: string
  data: T
  message?: string
}

export interface ErrorDetails {
  code: string
  message: string
  details?: unknown
}

export interface ErrorEnvelope {
  status: string
  error: ErrorDetails
}

export interface ApiError {
  code: string
  message: string
  status: number
  details?: unknown
}

export interface HealthStatus {
  status: 'healthy' | 'ok' | 'degraded' | 'error' | string
  version: string
  environment: string
  database:
    | 'connected'
    | 'disconnected'
    | string
    | {
        status: 'connected' | 'disconnected'
        dialect?: string
      }
  timestamp?: string
  app_name?: string
}
