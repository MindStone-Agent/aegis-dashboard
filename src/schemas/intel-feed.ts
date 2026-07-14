import { z } from 'zod'

export const IntelFeedEntrySchema = z.object({
  id:          z.string(),
  priority:    z.enum(['HIGH', 'MEDIUM', 'LOW']),
  title:       z.string().min(1).max(500),
  source:      z.string().min(1),
  url:         z.string().url().optional(),
  publishedAt: z.string().datetime(),
  vendors:     z.array(z.string()),
  cves:        z.array(z.string()),
  otRelevance: z.string(),
  analystNote: z.string().optional(),
  domain:      z.enum(['OT', 'IT', 'BOTH']).default('BOTH').optional(),
  updatedAt:   z.string().datetime(),
  // OTPulse-inspired enrichment fields (all optional for backwards compat)
  urgencyTier: z.enum(['ACT_NOW', 'PLAN_PATCH', 'MONITOR']).optional().nullable(),
  kevStatus:   z.boolean().optional().nullable(),
  epssScore:   z.number().min(0).max(1).optional().nullable(),  // 0.0–1.0 from FIRST.org
  cvssScore:   z.number().min(0).max(10).optional().nullable(),
  pocAvailable: z.boolean().optional().nullable(),
})

export const IntelFeedSchema = z.array(IntelFeedEntrySchema)
export type IntelFeedEntry = z.infer<typeof IntelFeedEntrySchema>
export type IntelFeed = z.infer<typeof IntelFeedSchema>
