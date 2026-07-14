import { useQuery } from '@tanstack/react-query'
import { AgentActivitySchema } from '../schemas/agent-activity'
import { useUIStore } from '../store/uiStore'

export function useAgentActivity(limit = 20) {
  const pollIntervalSeconds = useUIStore(s => s.settings.pollIntervalSeconds)
  const pollInterval = pollIntervalSeconds * 1000

  return useQuery({
    queryKey: ['agent-activity', limit],
    queryFn: async () => {
      const res = await fetch('/data/agent-activity.json', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = await res.json() as unknown
      const parsed = AgentActivitySchema.parse(raw)
      return parsed.slice(0, limit)
    },
    refetchInterval: pollInterval,
    staleTime: (pollInterval * 5) / 6,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  })
}
