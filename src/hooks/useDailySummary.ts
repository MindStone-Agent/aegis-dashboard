import { useQuery } from '@tanstack/react-query'
import { DailySummarySchema } from '../schemas/daily-summary'
import { useUIStore } from '../store/uiStore'

export function useDailySummary() {
  const pollIntervalSeconds = useUIStore(s => s.settings.pollIntervalSeconds)
  const pollInterval = pollIntervalSeconds * 1000

  return useQuery({
    queryKey: ['daily-summary'],
    queryFn: async () => {
      const res = await fetch('/data/daily-summary.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = await res.json() as unknown
      const parsed = DailySummarySchema.parse(raw)
      return [...parsed].sort((a, b) => b.date.localeCompare(a.date))
    },
    refetchInterval: pollInterval,
    staleTime: (pollInterval * 5) / 6,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  })
}
