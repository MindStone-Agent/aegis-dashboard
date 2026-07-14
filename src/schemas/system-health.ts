import { z } from 'zod'

export const ApiStatusSchema = z.object({
  status:       z.enum(['OK', 'DEGRADED', 'ERROR', 'UNKNOWN']),
  lastChecked:  z.string().datetime(),
  errorMessage: z.string().optional(),
})

export const SystemHealthSchema = z.object({
  lastDreamCycle: z.object({
    runAt:        z.string().datetime(),
    chunksStored: z.number().int(),
    status:       z.enum(['OK', 'ERROR', 'SKIPPED']),
  }).optional(),
  vectorStore: z.object({
    totalDocuments: z.number().int(),
    lastUpdated:    z.string().datetime(),
  }).optional(),
  braveSearch: z.object({
    estimatedQueriesRemaining: z.number().int(),
    dailyQuota:                z.number().int(),
    queriesUsedToday:          z.number().int(),
    resetAt:                   z.string().datetime().optional(),
  }).optional(),
  apis: z.object({
    anthropic: ApiStatusSchema,
    openai:    ApiStatusSchema.optional(),
  }),
  updatedAt: z.string().datetime(),
})

export type SystemHealth = z.infer<typeof SystemHealthSchema>
export type ApiStatus = z.infer<typeof ApiStatusSchema>
