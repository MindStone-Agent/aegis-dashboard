import { z } from 'zod'

export const ActivityEntrySchema = z.object({
  id:       z.string(),
  at:       z.string().datetime(),
  type:     z.enum(['alert', 'intel_pull', 'dream_cycle', 'investigation', 'system', 'compaction']),
  severity: z.enum(['info', 'warning', 'high', 'critical']),
  title:    z.string().min(1).max(500),
  detail:   z.string(),
  tags:     z.array(z.string()),
})

export const AgentActivitySchema = z.array(ActivityEntrySchema)
export type ActivityEntry = z.infer<typeof ActivityEntrySchema>
export type AgentActivity = z.infer<typeof AgentActivitySchema>
