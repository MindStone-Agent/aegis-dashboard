import { useState } from 'react'
import { FlaskConical, AlertCircle, Loader2 } from 'lucide-react'
import { useInvestigations } from '../../hooks/useInvestigations'
import { InvestigationCard } from './InvestigationCard'
import { SkeletonPanel } from '../shared/SkeletonPanel'
import { ErrorBoundary } from '../shared/ErrorBoundary'
import { useQueryClient } from '@tanstack/react-query'

type StatusFilter = 'ACTIVE' | 'CLOSED'

function InvestigationsContent({ filter }: { filter: StatusFilter }) {
  const { data, isLoading, isError, error } = useInvestigations()
  const queryClient = useQueryClient()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <SkeletonPanel key={i} variant="investigation" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-aegis-bg-panel border border-red-500/20">
        <div className="flex items-center gap-2 text-red-400 text-xs font-mono">
          <AlertCircle size={12} />
          <span>{error instanceof Error ? error.message : 'Failed to load investigations'}</span>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['investigations'] })}
          className="text-xs font-mono text-amber-400 hover:text-amber-300 w-fit"
        >
          Retry
        </button>
      </div>
    )
  }

  const filtered = data?.filter(inv =>
    filter === 'ACTIVE'
      ? inv.status === 'ACTIVE'
      : inv.status === 'CLOSED'
  ) ?? []

  if (filtered.length === 0) {
    return (
      <div className="p-4 text-xs font-mono text-aegis-text-muted border border-aegis-border-panel bg-aegis-bg-panel">
        No {filter.toLowerCase()} investigations
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {filtered.map(inv => (
        <InvestigationCard key={inv.id} investigation={inv} />
      ))}
    </div>
  )
}

export function InvestigationsPanel() {
  const { data, isFetching } = useInvestigations()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<StatusFilter>('ACTIVE')

  const activeCount = data?.filter(inv => inv.status === 'ACTIVE').length ?? 0
  const closedCount = data?.filter(inv =>
    inv.status === 'CLOSED'
  ).length ?? 0

  return (
    <section className="bg-aegis-bg-base border border-aegis-border-panel">
      <div className="flex items-center justify-between px-3 py-2 border-b border-aegis-border-panel bg-aegis-bg-panel">
        <div className="flex items-center gap-2">
          <FlaskConical size={12} className="text-amber-500" />
          <span className="text-xs font-mono font-semibold text-aegis-text-primary tracking-widest">
            INVESTIGATIONS
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isFetching && <Loader2 size={11} className="animate-spin text-amber-500/60" />}
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['investigations'] })}
            className="text-xs font-mono text-aegis-text-muted hover:text-amber-400 transition-colors"
            aria-label="Refresh investigations"
          >
            REFRESH
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-aegis-border-panel">
        <button
          onClick={() => setFilter('ACTIVE')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono transition-colors ${
            filter === 'ACTIVE'
              ? 'text-amber-400 border-b border-amber-500 bg-amber-500/5'
              : 'text-aegis-text-muted hover:text-aegis-text-primary'
          }`}
        >
          ACTIVE
          {data && (
            <span className={`px-1 py-0.5 text-xs ${
              filter === 'ACTIVE' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-700/40 text-aegis-text-muted'
            }`}>
              {activeCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter('CLOSED')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono transition-colors ${
            filter === 'CLOSED'
              ? 'text-gray-400 border-b border-gray-500 bg-gray-500/5'
              : 'text-aegis-text-muted hover:text-aegis-text-primary'
          }`}
        >
          CLOSED
          {data && (
            <span className={`px-1 py-0.5 text-xs ${
              filter === 'CLOSED' ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-700/40 text-aegis-text-muted'
            }`}>
              {closedCount}
            </span>
          )}
        </button>
      </div>

      <div className="p-2">
        <ErrorBoundary
          fallbackTitle="INVESTIGATIONS ERROR"
          onReset={() => queryClient.invalidateQueries({ queryKey: ['investigations'] })}
        >
          <InvestigationsContent filter={filter} />
        </ErrorBoundary>
      </div>
    </section>
  )
}
