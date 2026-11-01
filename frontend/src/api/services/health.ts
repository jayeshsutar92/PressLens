import { apiClient } from '../client.ts'
import type { HealthStatus } from '../../types/api.ts'

export const healthService = {
  checkHealth: (): Promise<HealthStatus> => {
    return apiClient.get<HealthStatus>('/health')
  },
}
