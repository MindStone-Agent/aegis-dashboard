import { useState } from 'react'
import { ChevronDown, ChevronRight, Maximize2 } from 'lucide-react'
import type { InvestigationEntry, InvestigationStage } from '../../schemas/investigations'
import { ConfidenceBadge } from '../shared/ConfidenceBadge'
import { StalenessBadge } from '../shared/StalenessBadge'
import { InvestigationDetailModal } from './InvestigationDetailModal'
import { formatDistanceToNow } from 'date-fns'

interface InvestigationCardProps {
  investigation: InvestigationEntry
}

const STAGES: { key: InvestigationStage; label: string; short: string }[] = [
  { key: 'INITIAL_ACCESS',       label: 'Initial Access',       short: 'INIT' },
  { key: 'EXECUTION',            label: 'Execution',            short: 'EXEC' },
  { key: 'PERSISTENCE',          label: 'Persistence',          short: 'PERS' },
  { key: 'PRIVILEGE_ESCALATION', label: 'Priv Escalation',      short: 'PRIV' },
  { key: 'DEFENSE_EVASION',      label: 'Defense Evasion',      short: 'DEFEV' },
  { key: 'LATERAL_MOVEMENT',     label: 'Lateral Movement',     short: 'LAT' },
  { key: 'COLLECTION',           label: 'Collection',           short: 'COLL' },
  { key: 'INHIBIT_RESPONSE',     label: 'Inhibit Response',     short: 'INHIB' },
  { key: 'IMPACT',               label: 'Impact',               short: 'IMP' },
]


const CONFIDENCE_ROW_COLORS: Record<string, string> = {
  HIGH:       'text-green-400',
  MEDIUM:     'text-amber-400',
  LOW:        'text-blue-400',
  SPECULATIVE:'text-gray-400',
}

function StageTracker({ currentStage }: { currentStage: InvestigationStage }) {
  const currentIdx = STAGES.findIndex(s => s.key === currentStage)
  return (
    <div className="flex items-center gap-0">
      {STAGES.map((stage, idx) => {
        const isComplete = idx < currentIdx
        const isCurrent = idx === currentIdx
        const isFuture = idx > currentIdx
        return (
          <div key={stage.key} className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
            <div
              className={`h-1.5 w-full ${
                isComplete ? 'bg-amber-500/50' :
                isCurrent  ? 'bg-amber-500' :
                             'bg-gray-700'
              }`}
              title={stage.label}
            />
            <span className={`text-[9px] font-mono truncate w-full text-center leading-tight
              ${isCurrent ? 'text-amber-400 font-semibold' :
                isComplete ? 'text-aegis-text-muted' :
                isFuture   ? 'text-gray-700' : ''}`}
            >
              {stage.short}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function InvestigationCard({ investigation }: InvestigationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  const currentStageLabel = STAGES.find(s => s.key === investigation.stage)?.label ?? investigation.stage
  const lastUpdated = (() => {
    try {
      return formatDistanceToNow(new Date(investigation.updatedAt), { addSuffix: true })
    } catch {
      return investigation.updatedAt
    }
  })()

  return (
    <div className="border border-aegis-border-panel bg-aegis-bg-panel">
      <button
        className="w-full text-left px-3 py-2.5 flex items-start gap-3"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <span className="text-xs font-sans text-aegis-text-primary font-medium leading-snug flex-1">
              {investigation.scenarioName}
            </span>
            <div className="flex-shrink-0">
              {expanded ? <ChevronDown size={13} className="text-aegis-text-muted" /> : <ChevronRight size={13} className="text-aegis-text-muted" />}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-mono px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {currentStageLabel.toUpperCase()}
            </span>
            <span className="text-xs font-mono px-1.5 py-0.5 bg-gray-700/30 text-aegis-text-secondary border border-gray-600/30">
              {investigation.sector}
            </span>
            <StalenessBadge updatedAt={investigation.updatedAt} />
            <span className="text-xs font-mono text-aegis-text-muted">{lastUpdated}</span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-aegis-border-panel/50 space-y-4">
          <div className="pt-3">
            <h4 className="text-xs font-mono font-semibold text-aegis-text-secondary uppercase tracking-wider mb-2">
              ICS ATT&amp;CK Kill Chain
            </h4>
            <StageTracker currentStage={investigation.stage} />
          </div>

          <div>
            <h4 className="text-xs font-mono font-semibold text-aegis-text-secondary uppercase tracking-wider mb-2">
              Hypotheses ({investigation.hypotheses.length})
            </h4>
            <div className="border border-aegis-border-panel overflow-hidden">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="bg-aegis-bg-overlay border-b border-aegis-border-panel">
                    <th className="text-left px-2 py-1.5 text-aegis-text-muted font-normal tracking-wider">HYPOTHESIS</th>
                    <th className="text-left px-2 py-1.5 text-aegis-text-muted font-normal tracking-wider w-24">CONFIDENCE</th>
                  </tr>
                </thead>
                <tbody>
                  {investigation.hypotheses.map((h, i) => (
                    <tr key={i} className="border-b border-aegis-border-panel/30 last:border-0">
                      <td className="px-2 py-2 text-aegis-text-secondary leading-relaxed">
                        <div>{h.hypothesis}</div>
                        {h.notes && (
                          <div className="text-aegis-text-muted italic mt-1">{h.notes}</div>
                        )}
                      </td>
                      <td className={`px-2 py-2 ${CONFIDENCE_ROW_COLORS[h.confidence]} font-semibold align-top`}>
                        <ConfidenceBadge confidence={h.confidence} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {investigation.analystNotes && (
            <div>
              <button
                onClick={() => setShowNotes(v => !v)}
                className="flex items-center gap-1.5 text-xs font-mono text-aegis-text-muted hover:text-aegis-text-secondary transition-colors mb-2"
                aria-expanded={showNotes}
              >
                {showNotes ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                ANALYST NOTES
              </button>
              {showNotes && (
                <p className="text-xs font-sans text-aegis-text-secondary leading-relaxed italic">
                  {investigation.analystNotes}
                </p>
              )}
            </div>
          )}

          {/* View Details — opens detail modal */}
          <div className="pt-1 border-t border-aegis-border-panel/30">
            <button
              onClick={e => { e.stopPropagation(); setShowDetail(true) }}
              className="flex items-center gap-1.5 text-xs font-mono text-amber-500/70 hover:text-amber-400 transition-colors"
            >
              <Maximize2 size={10} />
              VIEW FULL INVESTIGATION
            </button>
          </div>
        </div>
      )}

      {showDetail && (
        <InvestigationDetailModal
          investigation={investigation}
          onClose={() => setShowDetail(false)}
        />
      )}
    </div>
  )
}
