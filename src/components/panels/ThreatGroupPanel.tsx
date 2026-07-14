import { Users, AlertCircle, Loader2 } from 'lucide-react'
import { useThreatGroups } from '../../hooks/useThreatGroups'
import { ThreatGroupCard } from './ThreatGroupCard'
import { SkeletonPanel } from '../shared/SkeletonPanel'
import { ErrorBoundary } from '../shared/ErrorBoundary'
import { useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '../../store/uiStore'
import { matchesFocusMode } from '../../utils/focusFilter'

function ThreatGroupContent() {
  const { data, isLoading, isError, error } = useThreatGroups()
  const queryClient = useQueryClient()
  const focusMode = useUIStore(s => s.focusMode)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonPanel key={i} variant="threat-group-card" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-aegis-bg-panel border border-red-500/20">
        <div className="flex items-center gap-2 text-red-400 text-xs font-mono">
          <AlertCircle size={12} />
          <span>{error instanceof Error ? error.message : 'Failed to load threat groups'}</span>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['threat-groups'] })}
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
        No threat groups tracked
      </div>
    )
  }

  const filtered = data.filter(group => matchesFocusMode(group.domain, focusMode))

  if (filtered.length === 0) {
    return (
      <div className="p-4 text-xs font-mono text-aegis-text-muted border border-aegis-border-panel bg-aegis-bg-panel">
        No threat groups match the current focus mode
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
      {filtered.map(group => (
        <ThreatGroupCard key={group.name} group={group} />
      ))}
    </div>
  )
}

export function ThreatGroupPanel() {
  const { isFetching } = useThreatGroups()
  const queryClient = useQueryClient()

  return (
    <section className="bg-aegis-bg-base border border-aegis-border-panel">
      <div className="flex items-center justify-between px-3 py-2 border-b border-aegis-border-panel bg-aegis-bg-panel">
        <div className="flex items-center gap-2">
          <Users size={12} className="text-amber-500" />
          <span className="text-xs font-mono font-semibold text-aegis-text-primary tracking-widest">
            THREAT GROUP TRACKER
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isFetching && <Loader2 size={11} className="animate-spin text-amber-500/60" />}
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['threat-groups'] })}
            className="text-xs font-mono text-aegis-text-muted hover:text-amber-400 transition-colors"
            aria-label="Refresh threat groups"
          >
            REFRESH
          </button>
        </div>
      </div>
      <div className="p-2">
        <ErrorBoundary
          fallbackTitle="THREAT GROUP ERROR"
          onReset={() => queryClient.invalidateQueries({ queryKey: ['threat-groups'] })}
        >
          <ThreatGroupContent />
        </ErrorBoundary>
      </div>
    </section>
  )
}
