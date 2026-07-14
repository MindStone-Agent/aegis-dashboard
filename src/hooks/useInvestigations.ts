import { useQuery } from '@tanstack/react-query'
import { InvestigationsSchema } from '../schemas/investigations'
import { useUIStore } from '../store/uiStore'

export function useInvestigations() {
  const pollIntervalSeconds = useUIStore(s => s.settings.pollIntervalSeconds)
  const pollInterval = pollIntervalSeconds * 1000

  return useQuery({
    queryKey: ['investigations'],
    queryFn: async () => {
      const res = await fetch('/data/investigations.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = await res.json() as unknown
      return InvestigationsSchema.parse(raw)
    },
    refetchInterval: pollInterval,
    staleTime: (pollInterval * 5) / 6,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  })
}
