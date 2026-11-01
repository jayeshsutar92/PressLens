export interface SourceMetadata {
  author?: string
  publication?: string
  year?: number
  url?: string
  credibility_rating?: number
}

export interface KnowledgeDocument {
  id: string
  title: string
  topic: string
  category: string
  summary: string
  content: string
  tactical_principles: string[]
  source_metadata: SourceMetadata
  tags: string[]
  created_at: string
  updated_at: string
}

export interface TopicSummary {
  topic: string
  category: string
  document_count: number
  description: string
}
