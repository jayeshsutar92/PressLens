export function formatMatchPhase(phase?: string): string {
  if (!phase) return 'Unknown Phase'
  return phase
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function formatDate(isoString?: string): string {
  if (!isoString) return '-'
  try {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return isoString
  }
}

export function formatPercent(score: number): string {
  return `${Math.round(score * 100)}%`
}
