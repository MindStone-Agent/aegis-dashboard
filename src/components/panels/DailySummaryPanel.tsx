import { useState } from 'react'
import { FileText, AlertCircle, ChevronLeft, ChevronRight, ChevronDown, Loader2 } from 'lucide-react'
import { useDailySummary } from '../../hooks/useDailySummary'
import { SkeletonPanel } from '../shared/SkeletonPanel'
import { ErrorBoundary } from '../shared/ErrorBoundary'
import { useQueryClient } from '@tanstack/react-query'
import type { DailySummaryEntry } from '../../schemas/daily-summary'

const SEVERITY_COLORS: Record<string, string> = {
  HIGH:   'text-red-400',
  MEDIUM: 'text-amber-400',
  LOW:    'text-blue-400',
}

function SummaryContent({ entry, index, total, onPrev, onNext }: {
  entry: DailySummaryEntry
  index: number
  total: number
  onPrev: () => void
  onNext: () => void
}) {
  const [alertsExpanded, setAlertsExpanded] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-mono font-bold text-aegis-text-primary tracking-wider">
          {entry.date}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            disabled={index >= total - 1}
            className="p-1 text-aegis-text-muted hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous day"
            title="Previous day"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-mono text-aegis-text-muted px-1">
            {index + 1} / {total}
          </span>
          <button
            onClick={onNext}
            disabled={index <= 0}
            className="p-1 text-aegis-text-muted hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next day"
            title="Next day"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <h4 className="text-xs font-mono font-semibold text-aegis-text-secondary tracking-widest uppercase mb-2">
            Sources Checked ({entry.sourceCount})
          </h4>
          <div className="flex flex-wrap gap-1">
            {entry.sourcesChecked.map(src => (
              <span key={src} className="text-xs font-mono px-1.5 py-0.5 bg-gray-700/30 text-aegis-text-secondary border border-gray-600/20">
                {src}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-mono font-semibold text-aegis-text-secondary tracking-widest uppercase mb-2">
            Alerts Triggered
            {entry.alertsTriggered.length > 0 && (
              <span className="ml-2 bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 text-xs">
                {entry.alertsTriggered.length}
              </span>
            )}
          </h4>
          {entry.alertsTriggered.length === 0 ? (
            <span className="text-xs font-mono text-aegis-text-muted">No alerts</span>
          ) : (
            <div>
              <button
                onClick={() => setAlertsExpanded(v => !v)}
                className="flex items-center gap-1.5 text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors"
                aria-expanded={alertsExpanded}
              >
                <ChevronDown size={11} className={`transition-transform ${alertsExpanded ? '' : '-rotate-90'}`} />
                {alertsExpanded ? 'Hide alerts' : 'View alerts'}
              </button>
              {alertsExpanded && (
                <div className="mt-2 space-y-1.5">
                  {entry.alertsTriggered.map((alert, i) => (
                    <div key={i} className="text-xs font-mono">
                      <span className={`${SEVERITY_COLORS[alert.severity]} mr-2`}>[{alert.severity}]</span>
                      <span className="text-aegis-text-secondary">{alert.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {entry.topFindings.length > 0 && (
        <div>
          <h4 className="text-xs font-mono font-semibold text-aegis-text-secondary tracking-widest uppercase mb-2">
            Top Findings
          </h4>
          <div className="space-y-3">
            {entry.topFindings.map(finding => (
              <div key={finding.rank} className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-amber-500/20 text-amber-400 text-xs font-mono font-bold border border-amber-500/30">
                  {finding.rank}
                </span>
                <div>
                  <p className="text-xs text-aegis-text-primary leading-relaxed">{finding.description}</p>
                  <p className="text-xs font-mono text-aegis-text-muted mt-0.5">Source: {finding.source}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {entry.logFilePath && (
        <div className="pt-1 border-t border-aegis-border-panel/30">
          <span className="text-xs font-mono text-aegis-text-muted">Log: </span>
          <a
            href={`file://${entry.logFilePath}`}
            className="text-xs font-mono text-amber-400/70 hover:text-amber-400 transition-colors break-all"
          >
            {entry.logFilePath}
          </a>
        </div>
      )}
    </div>
  )
}

function DailySummaryContent() {
  const { data, isLoading, isError, error, dataUpdatedAt } = useDailySummary()
  const queryClient = useQueryClient()
  const [currentIndex, setCurrentIndex] = useState(0)

  if (isLoading) {
    return <SkeletonPanel variant="daily-summary" />
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-aegis-bg-panel border border-red-500/20">
        <div className="flex items-center gap-2 text-red-400 text-xs font-mono">
          <AlertCircle size={12} />
          <span>{error instanceof Error ? error.message : 'Failed to load daily summary'}</span>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['daily-summary'] })}
          className="text-xs font-mono text-amber-400 hover:text-amber-300 w-fit"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-xs font-mono text-aegis-text-muted border border-aegis-border-panel bg-aegis-bg-panel">
        No summary for today — agent has not run
        {dataUpdatedAt && (
          <span> (last run: {new Date(dataUpdatedAt).toLocaleString()})</span>
        )}
      </div>
    )
  }

  const idx = Math.max(0, Math.min(currentIndex, data.length - 1))
  const entry = data[idx]

  return (
    <div className="bg-aegis-bg-panel border border-aegis-border-panel p-4">
      <SummaryContent
        entry={entry}
        index={idx}
        total={data.length}
        onPrev={() => setCurrentIndex(i => Math.min(i + 1, data.length - 1))}
        onNext={() => setCurrentIndex(i => Math.max(i - 1, 0))}
      />
    </div>
  )
}

export function DailySummaryPanel() {
  const { isFetching } = useDailySummary()
  const queryClient = useQueryClient()

  return (
    <section className="bg-aegis-bg-base border border-aegis-border-panel">
      <div className="flex items-center justify-between px-3 py-2 border-b border-aegis-border-panel bg-aegis-bg-panel">
        <div className="flex items-center gap-2">
          <FileText size={12} className="text-amber-500" />
          <span className="text-xs font-mono font-semibold text-aegis-text-primary tracking-widest">
            DAILY INTEL SUMMARY
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isFetching && <Loader2 size={11} className="animate-spin text-amber-500/60" />}
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['daily-summary'] })}
            className="text-xs font-mono text-aegis-text-muted hover:text-amber-400 transition-colors"
            aria-label="Refresh daily summary"
          >
            REFRESH
          </button>
        </div>
      </div>
      <div className="p-2">
        <ErrorBoundary
          fallbackTitle="SUMMARY ERROR"
          onReset={() => queryClient.invalidateQueries({ queryKey: ['daily-summary'] })}
        >
          <DailySummaryContent />
        </ErrorBoundary>
      </div>
    </section>
  )
}
