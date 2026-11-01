import { apiClient } from '../client.ts'
import type {
  KnowledgeDocument,
  TopicSummary,
} from '../../types/knowledge.ts'

export interface GetDocumentsParams {
  topic?: string
  category?: string
  search?: string
  skip?: number
  limit?: number
}

export const knowledgeService = {
  getTopics: (): Promise<TopicSummary[]> => {
    return apiClient.get<TopicSummary[]>('/knowledge/topics')
  },

  getDocuments: (params?: GetDocumentsParams): Promise<KnowledgeDocument[]> => {
    return apiClient.get<KnowledgeDocument[]>('/knowledge/documents', {
      params: params ? { ...params } : undefined,
    })
  },

  getDocumentById: (id: string): Promise<KnowledgeDocument> => {
    return apiClient.get<KnowledgeDocument>(`/knowledge/documents/${id}`)
  },
}
