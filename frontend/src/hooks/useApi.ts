import { useCallback, useEffect, useState } from 'react'
import type { ApiClientError } from '../api/client.ts'

export interface QueryOptions<T> {
  enabled?: boolean
  initialData?: T
  onSuccess?: (data: T) => void
  onError?: (error: ApiClientError | Error) => void
}

export interface QueryResult<T> {
  data: T | null
  isLoading: boolean
  isError: boolean
  error: ApiClientError | Error | null
  refetch: () => Promise<void>
}

export function useApiQuery<T>(
  queryFn: () => Promise<T>,
  deps: unknown[] = [],
  options: QueryOptions<T> = {},
): QueryResult<T> {
  const { enabled = true, initialData, onSuccess, onError } = options

  const [data, setData] = useState<T | null>(initialData ?? null)
  const [isLoading, setIsLoading] = useState<boolean>(enabled)
  const [error, setError] = useState<ApiClientError | Error | null>(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await queryFn()
      setData(result)
      onSuccess?.(result)
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error(String(err))
      setError(errorObj)
      onError?.(errorObj)
    } finally {
      setIsLoading(false)
    }
  }, [queryFn, onSuccess, onError])

  useEffect(() => {
    let isMounted = true

    if (enabled) {
      void (async () => {
        try {
          const result = await queryFn()
          if (isMounted) {
            setData(result)
            setError(null)
            setIsLoading(false)
            onSuccess?.(result)
          }
        } catch (err: unknown) {
          if (isMounted) {
            const errorObj = err instanceof Error ? err : new Error(String(err))
            setError(errorObj)
            setIsLoading(false)
            onError?.(errorObj)
          }
        }
      })()
    }

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps])

  return {
    data,
    isLoading,
    isError: error !== null,
    error,
    refetch,
  }
}

export interface MutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>
  data: TData | null
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  error: ApiClientError | Error | null
  reset: () => void
}

export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void
    onError?: (error: ApiClientError | Error, variables: TVariables) => void
  } = {},
): MutationResult<TData, TVariables> {
  const [data, setData] = useState<TData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSuccess, setIsSuccess] = useState<boolean>(false)
  const [error, setError] = useState<ApiClientError | Error | null>(null)

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsLoading(true)
      setIsSuccess(false)
      setError(null)
      try {
        const result = await mutationFn(variables)
        setData(result)
        setIsSuccess(true)
        options.onSuccess?.(result, variables)
        return result
      } catch (err: unknown) {
        const errorObj = err instanceof Error ? err : new Error(String(err))
        setError(errorObj)
        options.onError?.(errorObj, variables)
        throw errorObj
      } finally {
        setIsLoading(false)
      }
    },
    [mutationFn, options],
  )

  const reset = useCallback(() => {
    setData(null)
    setIsLoading(false)
    setIsSuccess(false)
    setError(null)
  }, [])

  return {
    mutate,
    data,
    isLoading,
    isSuccess,
    isError: error !== null,
    error,
    reset,
  }
}
