import { useState } from 'react'
import { Activity, ChevronDown, ChevronRight, AlertCircle, Loader2 } from 'lucide-react'
import { useAgentActivity } from '../../hooks/useAgentActivity'
import { SkeletonPanel } from '../shared/SkeletonPanel'
import { ErrorBoundary } from '../shared/ErrorBoundary'
import { useQueryClient } from '@tanstack/react-query'
import type { ActivityEntry } from '../../schemas/agent-activity'

const TYPE_LABELS: Record<string, string> = {
  alert:         'ALERT',
  intel_pull:    'INTEL',
  investigation: 'INVEST',
  dream_cycle:   'DREAM',
  compaction:    'COMPACT',
  system:        'SYS',
}

const TYPE_BADGE_CLASSES: Record<string, string> = {
  alert:         'text-red-400 border-red-500/50 bg-red-500/10',
  intel_pull:    'text-amber-400 border-amber-500/50 bg-amber-500/10',
  investigation: 'text-orange-400 border-orange-500/50 bg-orange-500/10',
  dream_cycle:   'text-indigo-400 border-indigo-500/50 bg-indigo-500/10',
  compaction:    'text-purple-400 border-purple-500/50 bg-purple-500/10',
  system:        'text-gray-400 border-gray-500/50 bg-gray-500/10',
}

const SEVERITY_ROW_CLASSES: Record<string, string> = {
  critical: 'border-l-2 border-l-red-500/60 bg-red-500/5',
  high:     'border-l-2 border-l-orange-500/50',
  warning:  'border-l-2 border-l-amber-500/40',
  info:     'border-l-2 border-l-transparent',
}

const SEVERITY_TITLE_CLASSES: Record<string, string> = {
  critical: 'text-red-300',
  high:     'text-orange-300',
  warning:  'text-amber-300',
  info:     'text-aegis-text-primary',
}

type FilterValue = 'all' | 'alert' | 'intel_pull' | 'system'

function filterEntries(entries: ActivityEntry[], filter: FilterValue): ActivityEntry[] {
  if (filter === 'all') return entries
  if (filter === 'alert') return entries.filter(e => e.type === 'alert')
  if (filter === 'intel_pull') return entries.filter(e => e.type === 'intel_pull')
  if (filter === 'system') return entries.filter(e => e.type === 'system' || e.type === 'compaction')
  return entries
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatFull(isoString: string): string {
  return new Date(isoString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function ActivityEntryRow({
  entry,
  isExpanded,
  onToggle,
}: {
  entry: ActivityEntry
  isExpanded: boolean
  onToggle: () => void
}) {
  const rowClass = SEVERITY_ROW_CLASSES[entry.severity] ?? ''
  const titleClass = SEVERITY_TITLE_CLASSES[entry.severity] ?? 'text-aegis-text-primary'
  const badgeClass = TYPE_BADGE_CLASSES[entry.type] ?? 'text-gray-400 border-gray-500/50 bg-gray-500/10'
  const typeLabel = TYPE_LABELS[entry.type] ?? entry.type.toUpperCase()

  return (
    <div
      className={`px-3 py-2 cursor-pointer hover:bg-aegis-bg-input/40 transition-colors ${rowClass}`}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
      aria-expanded={isExpanded}
    >
      <div className="flex items-start gap-2">
        {isExpanded
          ? <ChevronDown size={10} className="mt-0.5 flex-shrink-0 text-aegis-text-muted" aria-hidden="true" />
          : <ChevronRight size={10} className="mt-0.5 flex-shrink-0 text-aegis-text-muted" aria-hidden="true" />
        }
        <span className={`text-[10px] font-mono font-bold px-1 border flex-shrink-0 ${badgeClass}`}>
          {typeLabel}
        </span>
        <span className={`text-xs font-mono flex-1 leading-tight min-w-0 ${titleClass}`}>
          {entry.title}
        </span>
        <span className="text-[10px] font-mono text-aegis-text-muted flex-shrink-0 tabular-nums">
          {formatTime(entry.at)}
        </span>
      </div>

      {isExpanded && (
        <div className="mt-2 ml-4 space-y-2">
          <p className="text-xs font-mono text-aegis-text-secondary leading-relaxed">
            {entry.detail}
          </p>
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.tags.map(tag => (
                <span
                  key={tag}
                  className="text-[10px] font-mono px-1 border border-aegis-border-panel text-aegis-text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <span className="text-[10px] font-mono text-aegis-text-muted block">
            {formatFull(entry.at)}
          </span>
        </div>
      )}
    </div>
  )
}

function AgentActivityContent({
  filter,
  expandedId,
  onToggle,
}: {
  filter: FilterValue
  expandedId: string | null
  onToggle: (id: string) => void
}) {
  const { data, isLoading, isError, error, dataUpdatedAt } = useAgentActivity(20)
  const queryClient = useQueryClient()

  if (isLoading) {
    return <SkeletonPanel variant="agent-activity" />
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-3 p-3 bg-aegis-bg-panel border border-red-500/20">
        <div className="flex items-center gap-2 text-red-400 text-xs font-mono">
          <AlertCircle size={12} />
          <span>{error instanceof Error ? error.message : 'Failed to load agent activity'}</span>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['agent-activity'] })}
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
        No activity — agent has not written to activity log
        {dataUpdatedAt && (
          <span> (checked: {new Date(dataUpdatedAt).toLocaleString()})</span>
        )}
      </div>
    )
  }

  const filtered = filterEntries(data, filter)

  if (filtered.length === 0) {
    return (
      <div className="px-3 py-4 text-xs font-mono text-aegis-text-muted text-center">
        No activity matching selected filter
      </div>
    )
  }

  return (
    <div className="overflow-y-auto max-h-[400px] divide-y divide-aegis-border-panel/40">
      {filtered.map(entry => (
        <ActivityEntryRow
          key={entry.id}
          entry={entry}
          isExpanded={expandedId === entry.id}
          onToggle={() => onToggle(entry.id)}
        />
      ))}
    </div>
  )
}

export function AgentActivityPanel() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterValue>('all')
  const { isFetching } = useAgentActivity(20)
  const queryClient = useQueryClient()

  const handleToggle = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  return (
    <section className="bg-aegis-bg-base border border-aegis-border-panel">
      <div className="flex items-center justify-between px-3 py-2 border-b border-aegis-border-panel bg-aegis-bg-panel">
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-amber-500" aria-hidden="true" />
          <span className="text-xs font-mono font-semibold text-aegis-text-primary tracking-widest">
            AGENT ACTIVITY
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isFetching && <Loader2 size={11} className="animate-spin text-amber-500/60" aria-hidden="true" />}
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as FilterValue)}
            className="text-xs font-mono bg-aegis-bg-input border border-aegis-border-panel text-aegis-text-secondary px-1 py-0.5 focus:outline-none focus:border-amber-500/50"
            aria-label="Filter activity entries"
          >
            <option value="all">ALL</option>
            <option value="alert">ALERTS</option>
            <option value="intel_pull">INTEL</option>
            <option value="system">SYSTEM</option>
          </select>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['agent-activity'] })}
            className="text-xs font-mono text-aegis-text-muted hover:text-amber-400 transition-colors"
            aria-label="Refresh agent activity"
          >
            REFRESH
          </button>
        </div>
      </div>
      <div>
        <ErrorBoundary
          fallbackTitle="AGENT ACTIVITY ERROR"
          onReset={() => queryClient.invalidateQueries({ queryKey: ['agent-activity'] })}
        >
          <AgentActivityContent
            filter={filter}
            expandedId={expandedId}
            onToggle={handleToggle}
          />
        </ErrorBoundary>
      </div>
    </section>
  )
}
