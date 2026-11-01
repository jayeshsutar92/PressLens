export interface RecentAnalysisItem {
  id: string
  scenarioId: string
  scenarioTitle: string
  userQuery?: string
  pressingIntensity?: string
  status: string
  createdAt: string
}

const STORAGE_KEY = 'presslens_recent_analyses'
const MAX_RECENT_ITEMS = 25

export function getRecentAnalyses(): RecentAnalysisItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as RecentAnalysisItem[]) : []
  } catch {
    return []
  }
}

export function saveRecentAnalysis(item: RecentAnalysisItem): void {
  try {
    const current = getRecentAnalyses()
    // Filter out duplicate ID if re-run
    const filtered = current.filter((a) => a.id !== item.id)
    const updated = [item, ...filtered].slice(0, MAX_RECENT_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // Graceful fallback for non-storage environments
  }
}

export function removeRecentAnalysis(id: string): void {
  try {
    const current = getRecentAnalyses()
    const updated = current.filter((a) => a.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // Graceful fallback
  }
}

