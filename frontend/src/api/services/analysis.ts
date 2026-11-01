import { apiClient } from '../client.ts'
import type {
  Analysis,
  AnalysisCreateRequest,
  AnalysisDetail,
  AnalysisFollowUpRequest,
  AnalysisFollowUpResponse,
  AnalysisStatus,
} from '../../types/analysis.ts'

export const analysisService = {
  createAnalysis: (payload: AnalysisCreateRequest): Promise<Analysis> => {
    return apiClient.post<Analysis>('/analysis', payload)
  },

  getAnalysisById: (id: string): Promise<AnalysisDetail> => {
    return apiClient.get<AnalysisDetail>(`/analysis/${id}`)
  },

  submitFollowUp: (id: string, payload: AnalysisFollowUpRequest): Promise<AnalysisFollowUpResponse> => {
    return apiClient.post<AnalysisFollowUpResponse>(`/analysis/${id}/follow-up`, payload)
  },

  getAnalysisStatus: (id: string): Promise<AnalysisStatus> => {
    return apiClient.get<AnalysisStatus>(`/analysis/${id}/status`)
  },
}
