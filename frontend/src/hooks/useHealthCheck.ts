import { useCallback, useEffect, useState } from 'react'
import { healthService } from '../api/services/health.ts'
import type { HealthStatus } from '../types/api.ts'

export interface HealthCheckResult {
  isHealthy: boolean | null
  health: HealthStatus | null
  isChecking: boolean
  lastChecked: Date | null
  checkHealth: () => Promise<void>
}

export function useHealthCheck(pollIntervalMs = 30000): HealthCheckResult {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState<boolean>(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkHealth = useCallback(async () => {
    setIsChecking(true)
    try {
      const res = await healthService.checkHealth()
      setHealth(res)
      setIsHealthy(res.status === 'healthy' || res.status === 'ok')
      setLastChecked(new Date())
    } catch {
      setIsHealthy(false)
      setHealth(null)
      setLastChecked(new Date())
    } finally {
      setIsChecking(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    void (async () => {
      try {
        const res = await healthService.checkHealth()
        if (isMounted) {
          setHealth(res)
          setIsHealthy(res.status === 'healthy' || res.status === 'ok')
          setIsChecking(false)
          setLastChecked(new Date())
        }
      } catch {
        if (isMounted) {
          setIsHealthy(false)
          setHealth(null)
          setIsChecking(false)
          setLastChecked(new Date())
        }
      }
    })()

    if (pollIntervalMs > 0) {
      const timer = setInterval(() => {
        void checkHealth()
      }, pollIntervalMs)
      return () => {
        isMounted = false
        clearInterval(timer)
      }
    }

    return () => {
      isMounted = false
    }
  }, [checkHealth, pollIntervalMs])

  return {
    isHealthy,
    health,
    isChecking,
    lastChecked,
    checkHealth,
  }
}
