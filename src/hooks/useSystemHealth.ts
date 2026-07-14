import { useQuery } from '@tanstack/react-query'
import { SystemHealthSchema } from '../schemas/system-health'

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const res = await fetch('/data/system-health.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = await res.json() as unknown
      return SystemHealthSchema.parse(raw)
    },
    refetchInterval: 60_000,
    staleTime: 55_000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  })
}
