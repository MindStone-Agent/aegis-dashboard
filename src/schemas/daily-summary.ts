import { z } from 'zod'

export const AlertSchema = z.object({
  title:       z.string(),
  severity:    z.enum(['HIGH', 'MEDIUM', 'LOW']),
  triggeredAt: z.string().datetime(),
  // Default 'OT' for CISA ICS advisories; enterprise-only advisories should be tagged 'IT'
  domain:      z.enum(['OT', 'IT', 'BOTH']).default('OT').optional(),
})

export const TopFindingSchema = z.object({
  rank:        z.number().int().min(1).max(3),
  description: z.string(),
  source:      z.string(),
  relatedId:   z.string().nullable().optional(),
})

export const DailySummaryEntrySchema = z.object({
  date:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sourcesChecked:  z.array(z.string()),
  sourceCount:     z.number().int(),
  topFindings:     z.array(TopFindingSchema).max(3),
  alertsTriggered: z.array(AlertSchema),
  logFilePath:     z.string().optional(),
  createdAt:       z.string().datetime(),
})

export const DailySummarySchema = z.array(DailySummaryEntrySchema)
export type DailySummaryEntry = z.infer<typeof DailySummaryEntrySchema>
export type DailySummary = z.infer<typeof DailySummarySchema>
export type DailySummaryAlert = z.infer<typeof AlertSchema>
export type TopFinding = z.infer<typeof TopFindingSchema>
