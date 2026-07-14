import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import type { FocusMode } from '../utils/focusFilter'

const FocusModeFileSchema = z.object({
  mode: z.enum(['OT_ONLY', 'CONVERGED', 'BROAD']),
})

const POLL_INTERVAL_MS = 60_000 // 60 seconds — agent config changes infrequently

/**
 * Polls public/data/focus-mode.json to read the mode the Aegis agent was
 * operating in during its last intel pull. This is independent of the UI
 * toggle (user preference). Used only to surface a mismatch warning when
 * the analyst has selected BROAD view but the agent pulled in OT_ONLY mode.
 *
 * Returns null if the file cannot be fetched or parsed.
 */
export function useAgentFocusMode(): FocusMode | null {
  const { data } = useQuery({
    queryKey: ['agent-focus-mode'],
    queryFn: async () => {
      const res = await fetch('/data/focus-mode.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = await res.json() as unknown
      return FocusModeFileSchema.parse(raw).mode
    },
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: POLL_INTERVAL_MS,
    retry: 2,
    retryDelay: 3000,
  })

  return data ?? null
}
