import type { IntelFeedEntry } from '../schemas/intel-feed'

const PRIORITY_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }

export function sortIntelFeed(entries: IntelFeedEntry[]): IntelFeedEntry[] {
  return [...entries].sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })
}

export function deduplicateById<T extends { id: string }>(entries: T[]): T[] {
  const seen = new Set<string>()
  return entries.filter(e => {
    if (seen.has(e.id)) return false
    seen.add(e.id)
    return true
  })
}
