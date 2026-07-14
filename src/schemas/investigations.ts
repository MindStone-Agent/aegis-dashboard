import { z } from 'zod'

export const HypothesisSchema = z.object({
  hypothesis: z.string(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW', 'SPECULATIVE']),
  notes:      z.string().optional(),
  // Detail view: hypothesis lifecycle tracking
  status:     z.enum(['open', 'confirmed', 'ruled_out']).optional().default('open'),
})

export const InvestigationStageSchema = z.enum([
  'INITIAL_ACCESS', 'EXECUTION', 'PERSISTENCE',
  'PRIVILEGE_ESCALATION', 'DEFENSE_EVASION', 'LATERAL_MOVEMENT',
  'COLLECTION', 'INHIBIT_RESPONSE', 'IMPACT',
])

// Detail view: timeline events
export const TimelineEventSchema = z.object({
  at:           z.string().datetime(),
  event:        z.string(),
  significance: z.enum(['low', 'medium', 'high', 'critical']),
})

// Detail view: append-only analyst note history
// Replaces analystNotes (string) for new investigations — analystNotes kept for backward compat
export const AnalystNoteSchema = z.object({
  at:   z.string().datetime(),
  note: z.string(),
})

// Detail view: associated indicators (IOCs)
export const InvestigationIndicatorSchema = z.object({
  type:       z.enum(['domain', 'ip', 'hash', 'email', 'actor', 'url', 'file']),
  value:      z.string(),
  confidence: z.string(),
  addedAt:    z.string().datetime(),
})

export const InvestigationEntrySchema = z.object({
  id:           z.string(),
  scenarioName: z.string().min(1),
  sector:       z.string(),
  stage:        InvestigationStageSchema,
  hypotheses:   z.array(HypothesisSchema),
  nextActions:  z.array(z.string()),
  // ACTIVE: under active investigation
  // MONITORING: key events resolved, watching for recurrence/escalation
  // CLOSED: fully resolved, no further action expected
  status:       z.enum(['ACTIVE', 'MONITORING', 'CLOSED']).default('ACTIVE'),
  createdAt:    z.string().datetime(),
  updatedAt:    z.string().datetime(),

  // Summary card field — single string, backward compatible
  // Deprecated for new investigations: use noteHistory instead
  analystNotes: z.string().optional(),

  // Detail view fields — all optional for backward compat with existing entries
  timeline:               z.array(TimelineEventSchema).optional(),
  noteHistory:            z.array(AnalystNoteSchema).optional(),
  indicators:             z.array(InvestigationIndicatorSchema).optional(),
  relatedInvestigations:  z.array(z.string()).optional(),
})

export const InvestigationsSchema = z.array(InvestigationEntrySchema)

export type InvestigationEntry       = z.infer<typeof InvestigationEntrySchema>
export type InvestigationStage       = z.infer<typeof InvestigationStageSchema>
export type Hypothesis               = z.infer<typeof HypothesisSchema>
export type TimelineEvent            = z.infer<typeof TimelineEventSchema>
export type AnalystNote              = z.infer<typeof AnalystNoteSchema>
export type InvestigationIndicator   = z.infer<typeof InvestigationIndicatorSchema>
