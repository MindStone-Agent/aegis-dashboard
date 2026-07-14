#!/usr/bin/env node
// validate-dashboard.js
// Validates all dashboard JSON files against their Zod schemas.
// Run before committing: node scripts/validate-dashboard.js

const { z } = require('zod')
const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..', 'public', 'data')

let errors = 0

function validate(filename, schema, label) {
  const filepath = path.join(DATA_DIR, filename)
  if (!fs.existsSync(filepath)) {
    // Follow symlink
    console.log(`⚠️  ${label}: file not found at ${filepath} (may be symlink to workspace)`)
    return
  }
  const raw = fs.readFileSync(filepath, 'utf-8')
  let data
  try {
    data = JSON.parse(raw)
  } catch (e) {
    console.error(`❌ ${label}: JSON parse error — ${e.message}`)
    errors++
    return
  }
  const result = schema.safeParse(data)
  if (result.success) {
    console.log(`✅ ${label}: valid`)
  } else {
    console.error(`❌ ${label}: VALIDATION FAILED`)
    result.error.issues.forEach(issue => {
      console.error(`   [${issue.path.join('.')}] ${issue.message} (got: ${issue.received ?? 'undefined'})`)
    })
    errors++
  }
}

// ─── Schemas (inlined from src/schemas/*.ts) ───────────────────────────────

const AlertSchema = z.object({
  title:       z.string(),
  severity:    z.enum(['HIGH', 'MEDIUM', 'LOW']),
  triggeredAt: z.string().datetime(),
})

const TopFindingSchema = z.object({
  rank:        z.number().int().min(1).max(3),
  description: z.string(),
  source:      z.string(),
  relatedId:   z.string().nullable().optional(),
})

const DailySummaryEntrySchema = z.object({
  date:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sourcesChecked:  z.array(z.string()),
  sourceCount:     z.number().int(),
  topFindings:     z.array(TopFindingSchema).max(3),
  alertsTriggered: z.array(AlertSchema),
  logFilePath:     z.string().optional(),
  createdAt:       z.string().datetime(),
})

const IntelFeedEntrySchema = z.object({
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
  domain:      z.enum(['OT', 'IT', 'BOTH']).optional(),
  updatedAt:   z.string().datetime(),
})

const ThreatGroupEntrySchema = z.object({
  id:               z.string().optional(),
  name:             z.string().min(1),
  nexus:            z.string(),
  status:           z.enum(['ACTIVE', 'SILENT', 'PREPOSITIONING']),
  lastActivityDate: z.string(),
  targetSectors:    z.array(z.string()),
  ttps:             z.array(z.string()),
  confidence:       z.enum(['HIGH', 'MEDIUM', 'LOW']),
  notes:            z.string().optional(),
  domain:           z.enum(['OT', 'IT', 'BOTH']).optional(),
  updatedAt:        z.string().datetime(),
})

const ContextWindowSchema = z.object({
  model:           z.string(),
  maxTokens:       z.number(),
  currentTokens:   z.number().nullable(),
  utilizationPct:  z.number().nullable(),
  fresh:           z.boolean(),
  updatedAt:       z.string().datetime(),
  compactions:     z.object({
    lifetime: z.number(),
    lastAt:   z.string().nullable(),
  }),
}).optional()

const SystemHealthSchema = z.object({
  lastDreamCycle: z.object({
    runAt:         z.string().datetime(),
    chunksStored:  z.number().int(),
    status:        z.enum(['OK', 'ERROR', 'SKIPPED']),
  }),
  vectorStore: z.object({
    totalDocuments: z.number().int(),
    lastUpdated:    z.string().datetime(),
  }),
  braveSearch: z.object({
    estimatedQueriesRemaining: z.number().int(),
    dailyQuota:                z.number().int(),
    queriesUsedToday:          z.number().int(),
    resetAt:                   z.string().datetime().optional(),
  }),
  apis: z.object({
    anthropic: z.object({
      status:       z.enum(['OK', 'DEGRADED', 'ERROR', 'UNKNOWN']),
      lastChecked:  z.string().datetime(),
      errorMessage: z.string().optional(),
    }),
    openai: z.object({
      status:       z.enum(['OK', 'DEGRADED', 'ERROR', 'UNKNOWN']),
      lastChecked:  z.string().datetime(),
      errorMessage: z.string().optional(),
    }).optional(),
  }),
  contextWindow: ContextWindowSchema,
  updatedAt: z.string().datetime(),
})

const HypothesisSchema = z.object({
  hypothesis: z.string(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW', 'SPECULATIVE']),
  notes:      z.string().optional(),
})

const InvestigationEntrySchema = z.object({
  id:           z.string(),
  scenarioName: z.string().min(1),
  sector:       z.string(),
  stage:        z.enum([
    'INITIAL_ACCESS', 'EXECUTION', 'PERSISTENCE',
    'PRIVILEGE_ESCALATION', 'DEFENSE_EVASION', 'LATERAL_MOVEMENT',
    'COLLECTION', 'INHIBIT_RESPONSE', 'IMPACT',
  ]),
  hypotheses:   z.array(HypothesisSchema),
  nextActions:  z.array(z.string()),
  analystNotes: z.string().optional(),
  createdAt:    z.string().datetime(),
  updatedAt:    z.string().datetime(),
  status:       z.enum(['ACTIVE', 'CLOSED']).default('ACTIVE'),
})

// ─── Run validations ────────────────────────────────────────────────────────

validate('daily-summary.json',   z.array(DailySummaryEntrySchema),     'daily-summary.json')
validate('intel-feed.json',      z.array(IntelFeedEntrySchema),         'intel-feed.json')
validate('threat-groups.json',   z.array(ThreatGroupEntrySchema),       'threat-groups.json')
validate('system-health.json',   SystemHealthSchema,                    'system-health.json')
validate('investigations.json',  z.array(InvestigationEntrySchema),     'investigations.json')

// ─── Result ─────────────────────────────────────────────────────────────────

console.log('')
if (errors > 0) {
  console.error(`❌ ${errors} file(s) failed validation. Fix before committing.`)
  process.exit(1)
} else {
  console.log('✅ All dashboard files valid.')
}
