import { useQuery } from '@tanstack/react-query'
import { ThreatGroupsSchema } from '../schemas/threat-groups'
import { useUIStore } from '../store/uiStore'

export function useThreatGroups() {
  const pollIntervalSeconds = useUIStore(s => s.settings.pollIntervalSeconds)
  const pollInterval = pollIntervalSeconds * 1000

  return useQuery({
    queryKey: ['threat-groups'],
    queryFn: async () => {
      const res = await fetch('/data/threat-groups.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = await res.json() as unknown
      return ThreatGroupsSchema.parse(raw)
    },
    refetchInterval: pollInterval,
    staleTime: (pollInterval * 5) / 6,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  })
}
