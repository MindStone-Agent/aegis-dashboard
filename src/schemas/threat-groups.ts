import { z } from 'zod'

export const ThreatGroupEntrySchema = z.object({
  name:             z.string().min(1),
  nexus:            z.string(),
  // ACTIVE: confirmed recent activity (last 30 days)
  // PREPOSITIONING: assessed covert staging, no confirmed active ops
  // SILENT: no activity observed (30-90 days) — watch but don't dismiss
  // DORMANT: no activity 90+ days — deprioritized but retained
  // ARCHIVED: confirmed disbanded, absorbed, or rebranded — kept for historical reference
  status:           z.enum(['ACTIVE', 'PREPOSITIONING', 'SILENT', 'DORMANT', 'ARCHIVED']),
  lastActivityDate: z.string(),
  targetSectors:    z.array(z.string()),
  ttps:             z.array(z.string()),
  confidence:       z.enum(['HIGH', 'MEDIUM', 'LOW']),
  notes:            z.string().optional(),
  domain:           z.enum(['OT', 'IT', 'BOTH']).default('BOTH').optional(),
  updatedAt:        z.string().datetime(),
})

export const ThreatGroupsSchema = z.array(ThreatGroupEntrySchema)
export type ThreatGroupEntry = z.infer<typeof ThreatGroupEntrySchema>
export type ThreatGroups = z.infer<typeof ThreatGroupsSchema>
