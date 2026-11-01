import type { ApiError } from '../types/api.ts'

export class ApiClientError extends Error implements ApiError {
  status: number
  code: string
  details?: unknown

  constructor(message: string, status: number, code = 'API_ERROR', details?: unknown) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>
  timeoutMs?: number
  body?: BodyInit | null
}

const DEFAULT_BASE_URL = 'http://localhost:8000/api/v1'

export const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '')
  }
  return DEFAULT_BASE_URL
}

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getBaseUrl()
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    const url = new URL(`${this.baseUrl}${cleanPath}`)

    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.append(key, String(val))
        }
      })
    }

    return url.toString()
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, timeoutMs = 25000, headers = {}, ...rest } = options

    const url = this.buildUrl(path, params)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const mergedHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    }

    try {
      const response = await fetch(url, {
        ...rest,
        headers: mergedHeaders,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T
      }

      const contentType = response.headers.get('content-type')
      const isJson = contentType && contentType.includes('application/json')
      const responseData = isJson ? await response.json() : await response.text()

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        let errorCode = 'REQUEST_FAILED'
        let details: unknown = undefined

        if (typeof responseData === 'object' && responseData !== null) {
          const errObj = responseData as Record<string, unknown>
          if (typeof errObj.detail === 'string') {
            errorMessage = errObj.detail
          } else if (errObj.error && typeof errObj.error === 'object') {
            const nested = errObj.error as Record<string, unknown>
            errorMessage = typeof nested.message === 'string' ? nested.message : errorMessage
            errorCode = typeof nested.code === 'string' ? nested.code : errorCode
            details = nested.details
          } else if (Array.isArray(errObj.detail)) {
            // FastAPI pydantic validation errors
            errorMessage = errObj.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join('; ') || errorMessage
            errorCode = 'VALIDATION_ERROR'
            details = errObj.detail
          }
        }

        throw new ApiClientError(errorMessage, response.status, errorCode, details)
      }

      return responseData as T
    } catch (err: unknown) {
      clearTimeout(timeoutId)

      if (err instanceof ApiClientError) {
        throw err
      }

      if (err instanceof Error && err.name === 'AbortError') {
        throw new ApiClientError(
          `Request to ${path} timed out after ${timeoutMs}ms`,
          408,
          'REQUEST_TIMEOUT',
        )
      }

      const message = err instanceof Error ? err.message : 'Unknown network connection failure'
      throw new ApiClientError(
        `Failed to reach backend API: ${message}`,
        0,
        'NETWORK_ERROR',
      )
    }
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' })
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()
