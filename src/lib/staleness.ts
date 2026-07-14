export type StalenessLevel = 'fresh' | 'aging' | 'stale'

export function getStaleness(updatedAt: string): StalenessLevel {
  const now = Date.now()
  const updated = new Date(updatedAt).getTime()
  const diffMs = now - updated
  const hours = diffMs / (1000 * 60 * 60)

  if (hours < 24) return 'fresh'
  if (hours < 24 * 7) return 'aging'
  return 'stale'
}

export function getStalenessLabel(level: StalenessLevel): string {
  switch (level) {
    case 'fresh': return '< 24h'
    case 'aging': return '< 7d'
    case 'stale': return '> 7d'
  }
}

export function getStalenessColor(level: StalenessLevel): string {
  switch (level) {
    case 'fresh': return 'text-green-400'
    case 'aging': return 'text-yellow-400'
    case 'stale': return 'text-gray-500'
  }
}
