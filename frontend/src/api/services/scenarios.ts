import { apiClient } from '../client.ts'
import type {
  Scenario,
  ScenarioCreatePayload,
  ScenarioSummary,
} from '../../types/scenario.ts'

export interface GetScenariosParams {
  match_phase?: string
  is_prepared?: boolean
  skip?: number
  limit?: number
}

export const scenarioService = {
  getScenarios: (params?: GetScenariosParams): Promise<ScenarioSummary[]> => {
    return apiClient.get<ScenarioSummary[]>('/scenarios', {
      params: params ? { ...params } : undefined,
    })
  },

  getScenarioById: (id: string): Promise<Scenario> => {
    return apiClient.get<Scenario>(`/scenarios/${id}`)
  },

  createScenario: (payload: ScenarioCreatePayload): Promise<Scenario> => {
    return apiClient.post<Scenario>('/scenarios', payload)
  },

  deleteScenario: (id: string): Promise<{ status: string; message: string }> => {
    return apiClient.delete<{ status: string; message: string }>(`/scenarios/${id}`)
  },
}
