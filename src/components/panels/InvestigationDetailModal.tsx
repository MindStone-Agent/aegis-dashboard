import { useEffect } from 'react'
import { X, Clock, AlertTriangle, CheckCircle, XCircle, Circle } from 'lucide-react'
import type { InvestigationEntry, TimelineEvent, AnalystNote, InvestigationIndicator } from '../../schemas/investigations'
import { ConfidenceBadge } from '../shared/ConfidenceBadge'
import { format } from 'date-fns'

interface InvestigationDetailModalProps {
  investigation: InvestigationEntry
  onClose: () => void
}

const SIGNIFICANCE_COLORS: Record<TimelineEvent['significance'], string> = {
  critical: 'text-red-400 border-red-500/50 bg-red-500/10',
  high:     'text-amber-400 border-amber-500/50 bg-amber-500/10',
  medium:   'text-yellow-400 border-yellow-500/50 bg-yellow-500/10',
  low:      'text-blue-400 border-blue-500/30 bg-blue-500/5',
}

const SIGNIFICANCE_DOT: Record<TimelineEvent['significance'], string> = {
  critical: 'bg-red-500',
  high:     'bg-amber-500',
  medium:   'bg-yellow-500',
  low:      'bg-blue-500',
}

const INDICATOR_COLORS: Record<string, string> = {
  domain: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  ip:     'text-blue-400 bg-blue-500/10 border-blue-500/30',
  hash:   'text-gray-400 bg-gray-500/10 border-gray-500/30',
  email:  'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  actor:  'text-orange-400 bg-orange-500/10 border-orange-500/30',
  url:    'text-green-400 bg-green-500/10 border-green-500/30',
  file:   'text-pink-400 bg-pink-500/10 border-pink-500/30',
}

function HypothesisStatusIcon({ status }: { status?: string }) {
  if (status === 'confirmed') return <CheckCircle size={11} className="text-green-400 flex-shrink-0" />
  if (status === 'ruled_out') return <XCircle size={11} className="text-red-400 flex-shrink-0" />
  return <Circle size={11} className="text-gray-500 flex-shrink-0" />
}

function TimelineSection({ events }: { events: TimelineEvent[] }) {
  const sorted = [...events].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
  return (
    <div className="space-y-0">
      {sorted.map((event, i) => (
        <div key={i} className="flex gap-3">
          {/* Timeline line + dot */}
          <div className="flex flex-col items-center flex-shrink-0 w-4">
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${SIGNIFICANCE_DOT[event.significance]}`} />
            {i < sorted.length - 1 && (
              <div className="w-px flex-1 bg-gray-700 mt-1" />
            )}
          </div>
          {/* Event content */}
          <div className="pb-4 flex-1">
            <div className="flex items-start gap-2 flex-wrap">
              <span className={`text-[10px] font-mono px-1 py-0.5 border ${SIGNIFICANCE_COLORS[event.significance]}`}>
                {event.significance.toUpperCase()}
              </span>
              <span className="text-[10px] font-mono text-aegis-text-muted">
                {(() => {
                  try { return format(new Date(event.at), 'MMM d, yyyy HH:mm') + ' UTC' }
                  catch { return event.at }
                })()}
              </span>
            </div>
            <p className="text-xs text-aegis-text-secondary leading-relaxed mt-1">{event.event}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function NoteHistorySection({ notes }: { notes: AnalystNote[] }) {
  const sorted = [...notes].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  return (
    <div className="space-y-3">
      {sorted.map((note, i) => (
        <div key={i} className="border-l-2 border-amber-500/30 pl-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={10} className="text-aegis-text-muted" />
            <span className="text-[10px] font-mono text-aegis-text-muted">
              {(() => {
                try { return format(new Date(note.at), 'MMM d, yyyy HH:mm') + ' UTC' }
                catch { return note.at }
              })()}
            </span>
          </div>
          <p className="text-xs text-aegis-text-secondary leading-relaxed">{note.note}</p>
        </div>
      ))}
    </div>
  )
}

function IndicatorsSection({ indicators }: { indicators: InvestigationIndicator[] }) {
  return (
    <div className="space-y-1.5">
      {indicators.map((ioc, i) => (
        <div key={i} className="flex items-start gap-2 font-mono text-xs">
          <span className={`px-1.5 py-0.5 text-[10px] border flex-shrink-0 ${INDICATOR_COLORS[ioc.type] ?? 'text-gray-400'}`}>
            {ioc.type.toUpperCase()}
          </span>
          <span className="text-aegis-text-primary break-all">{ioc.value}</span>
          <span className="text-aegis-text-muted flex-shrink-0 ml-auto">{ioc.confidence}</span>
        </div>
      ))}
    </div>
  )
}

export function InvestigationDetailModal({ investigation, onClose }: InvestigationDetailModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const createdAt = (() => {
    try { return format(new Date(investigation.createdAt), 'MMM d, yyyy') }
    catch { return investigation.createdAt }
  })()
  const updatedAt = (() => {
    try { return format(new Date(investigation.updatedAt), 'MMM d, yyyy HH:mm') + ' UTC' }
    catch { return investigation.updatedAt }
  })()

  const openHypotheses   = investigation.hypotheses.filter(h => !h.status || h.status === 'open')
  const confirmedHypotheses = investigation.hypotheses.filter(h => h.status === 'confirmed')
  const ruledOutHypotheses  = investigation.hypotheses.filter(h => h.status === 'ruled_out')

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Investigation: ${investigation.scenarioName}`}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-aegis-bg-panel border-l border-aegis-border-panel flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-aegis-border-panel bg-aegis-bg-overlay flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {investigation.id.toUpperCase()}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 border ${
                investigation.status === 'ACTIVE'
                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
              }`}>
                {investigation.status}
              </span>
            </div>
            <h2 className="text-sm font-sans font-semibold text-aegis-text-primary leading-snug">
              {investigation.scenarioName}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-aegis-text-muted">
              <span>{investigation.sector}</span>
              <span>Opened {createdAt}</span>
              <span>Updated {updatedAt}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-aegis-text-muted hover:text-aegis-text-primary transition-colors flex-shrink-0 p-1"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 pb-20 space-y-6">

          {/* Timeline */}
          {investigation.timeline && investigation.timeline.length > 0 && (
            <section>
              <h3 className="text-xs font-mono font-semibold text-aegis-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock size={11} />
                Timeline ({investigation.timeline.length} events)
              </h3>
              <TimelineSection events={investigation.timeline} />
            </section>
          )}

          {/* Hypotheses */}
          <section>
            <h3 className="text-xs font-mono font-semibold text-aegis-text-secondary uppercase tracking-wider mb-3">
              Hypotheses ({investigation.hypotheses.length})
            </h3>
            <div className="space-y-2">
              {/* Confirmed first */}
              {confirmedHypotheses.map((h, i) => (
                <div key={`confirmed-${i}`} className="flex items-start gap-2 p-2 border border-green-500/20 bg-green-500/5">
                  <HypothesisStatusIcon status="confirmed" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-aegis-text-secondary leading-relaxed">{h.hypothesis}</p>
                    {h.notes && <p className="text-[10px] text-aegis-text-muted italic mt-0.5">{h.notes}</p>}
                  </div>
                  <ConfidenceBadge confidence={h.confidence} />
                </div>
              ))}
              {/* Open */}
              {openHypotheses.map((h, i) => (
                <div key={`open-${i}`} className="flex items-start gap-2 p-2 border border-aegis-border-panel bg-aegis-bg-overlay">
                  <HypothesisStatusIcon status="open" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-aegis-text-secondary leading-relaxed">{h.hypothesis}</p>
                    {h.notes && <p className="text-[10px] text-aegis-text-muted italic mt-0.5">{h.notes}</p>}
                  </div>
                  <ConfidenceBadge confidence={h.confidence} />
                </div>
              ))}
              {/* Ruled out last */}
              {ruledOutHypotheses.map((h, i) => (
                <div key={`ruled-${i}`} className="flex items-start gap-2 p-2 border border-red-500/10 bg-red-500/5 opacity-60">
                  <HypothesisStatusIcon status="ruled_out" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-aegis-text-secondary leading-relaxed line-through">{h.hypothesis}</p>
                    {h.notes && <p className="text-[10px] text-aegis-text-muted italic mt-0.5 no-underline">{h.notes}</p>}
                  </div>
                  <ConfidenceBadge confidence={h.confidence} />
                </div>
              ))}
            </div>
          </section>

          {/* Indicators / IOCs */}
          {investigation.indicators && investigation.indicators.length > 0 && (
            <section>
              <h3 className="text-xs font-mono font-semibold text-aegis-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle size={11} />
                Indicators ({investigation.indicators.length})
              </h3>
              <div className="border border-aegis-border-panel p-3 bg-aegis-bg-overlay">
                <IndicatorsSection indicators={investigation.indicators} />
              </div>
            </section>
          )}

          {/* Note History */}
          {investigation.noteHistory && investigation.noteHistory.length > 0 && (
            <section>
              <h3 className="text-xs font-mono font-semibold text-aegis-text-secondary uppercase tracking-wider mb-3">
                Analyst Notes ({investigation.noteHistory.length})
              </h3>
              <NoteHistorySection notes={investigation.noteHistory} />
            </section>
          )}

          {/* Legacy analystNotes (older investigations without noteHistory) */}
          {investigation.analystNotes && (!investigation.noteHistory || investigation.noteHistory.length === 0) && (
            <section>
              <h3 className="text-xs font-mono font-semibold text-aegis-text-secondary uppercase tracking-wider mb-3">
                Analyst Notes
              </h3>
              <p className="text-xs font-sans text-aegis-text-secondary leading-relaxed italic">
                {investigation.analystNotes}
              </p>
            </section>
          )}

          {/* Next Actions */}
          {investigation.nextActions.length > 0 && (
            <section>
              <h3 className="text-xs font-mono font-semibold text-aegis-text-secondary uppercase tracking-wider mb-3">
                Next Actions
              </h3>
              <ol className="space-y-1.5">
                {investigation.nextActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-aegis-text-secondary">
                    <span className="font-mono text-amber-500/70 flex-shrink-0 w-4">{i + 1}.</span>
                    <span className="leading-relaxed">{action}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Related Investigations */}
          {investigation.relatedInvestigations && investigation.relatedInvestigations.length > 0 && (
            <section>
              <h3 className="text-xs font-mono font-semibold text-aegis-text-secondary uppercase tracking-wider mb-2">
                Related Investigations
              </h3>
              <div className="flex gap-2 flex-wrap">
                {investigation.relatedInvestigations.map((id, i) => (
                  <span key={i} className="text-[10px] font-mono px-2 py-1 bg-aegis-bg-overlay border border-aegis-border-panel text-aegis-text-muted">
                    {id.toUpperCase()}
                  </span>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </>
  )
}
