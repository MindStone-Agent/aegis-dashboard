import { useQuery } from '@tanstack/react-query'
import { IntelFeedSchema } from '../schemas/intel-feed'
import { sortIntelFeed, deduplicateById } from '../lib/sort'
import { useUIStore } from '../store/uiStore'

export function useIntelFeed() {
  const pollIntervalSeconds = useUIStore(s => s.settings.pollIntervalSeconds)
  const pollInterval = pollIntervalSeconds * 1000

  return useQuery({
    queryKey: ['intel-feed'],
    queryFn: async () => {
      const res = await fetch('/data/intel-feed.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = await res.json() as unknown
      const parsed = IntelFeedSchema.parse(raw)
      return sortIntelFeed(deduplicateById(parsed))
    },
    refetchInterval: pollInterval,
    staleTime: (pollInterval * 5) / 6,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  })
}
