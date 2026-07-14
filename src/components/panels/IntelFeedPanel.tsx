import { useState, useEffect, useRef } from 'react'
import { Radio, AlertCircle, Loader2 } from 'lucide-react'
import { useIntelFeed } from '../../hooks/useIntelFeed'
import { IntelFeedItem } from './IntelFeedItem'
import { SkeletonPanel } from '../shared/SkeletonPanel'
import { ErrorBoundary } from '../shared/ErrorBoundary'
import { useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '../../store/uiStore'
import { matchesFocusMode } from '../../utils/focusFilter'

function IntelFeedContent() {
  const { data, isLoading, isError, error, dataUpdatedAt } = useIntelFeed()
  const queryClient = useQueryClient()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set())
  const prevIdsRef = useRef<Set<string>>(new Set())
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const addUnreadHighItems = useUIStore(s => s.addUnreadHighItems)
  const focusMode = useUIStore(s => s.focusMode)

  useEffect(() => {
    if (!data) return
    const currentIds = new Set(data.map(item => item.id))
    const prevIds = prevIdsRef.current

    if (prevIds.size > 0) {
      const freshIds = new Set<string>()
      currentIds.forEach(id => {
        if (!prevIds.has(id)) freshIds.add(id)
      })
      if (freshIds.size > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: syncing highlight state in response to external data changes
        setNewItemIds(freshIds)
        // Count how many new items are HIGH priority and notify the global store
        const newHighCount = data.filter(item => freshIds.has(item.id) && item.priority === 'HIGH').length
        if (newHighCount > 0) addUnreadHighItems(newHighCount)
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
        highlightTimerRef.current = setTimeout(() => {
          setNewItemIds(new Set())
        }, 2200)
      }
    }

    prevIdsRef.current = currentIds
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    }
  }, [data, addUnreadHighItems])

  const handleToggle = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  if (isLoading) {
    return (
      <div className="space-y-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonPanel key={i} variant="intel-feed" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-3 p-3 bg-aegis-bg-panel border border-red-500/20">
        <div className="flex items-center gap-2 text-red-400 text-xs font-mono">
          <AlertCircle size={12} />
          <span>{error instanceof Error ? error.message : 'Failed to load intel feed'}</span>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['intel-feed'] })}
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
        No active advisories — agent last ran{' '}
        {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleString() : 'unknown'}
      </div>
    )
  }

  const filtered = data.filter(item => matchesFocusMode(item.domain, focusMode))

  if (filtered.length === 0) {
    return (
      <div className="p-4 text-xs font-mono text-aegis-text-muted border border-aegis-border-panel bg-aegis-bg-panel">
        No items match the current focus mode
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {filtered.map(item => (
        <IntelFeedItem
          key={item.id}
          item={item}
          isExpanded={expandedId === item.id}
          onToggle={() => handleToggle(item.id)}
          isNew={newItemIds.has(item.id)}
          domain={item.domain}
        />
      ))}
    </div>
  )
}

export function IntelFeedPanel() {
  const { data, isFetching } = useIntelFeed()
  const queryClient = useQueryClient()
  const clearUnreadHighItems = useUIStore(s => s.clearUnreadHighItems)
  const focusMode = useUIStore(s => s.focusMode)

  const filtered = data ? data.filter(item => matchesFocusMode(item.domain, focusMode)) : []
  const highCount = filtered.filter(item => item.priority === 'HIGH').length

  return (
    <section
      className="bg-aegis-bg-base border border-aegis-border-panel"
      // Clear unread alert counter whenever the analyst interacts with this panel
      onFocus={clearUnreadHighItems}
      onMouseEnter={clearUnreadHighItems}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-aegis-border-panel bg-aegis-bg-panel">
        <div className="flex items-center gap-2">
          <Radio size={12} className="text-amber-500" />
          <span className="text-xs font-mono font-semibold text-aegis-text-primary tracking-widest">
            THREAT INTEL FEED
          </span>
          {data && highCount > 0 && (
            <span className="text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/30 px-1.5 py-0.5">
              {highCount} HIGH
            </span>
          )}
          {data && (
            <span className="text-xs font-mono text-aegis-text-muted bg-gray-700/40 px-1.5 py-0.5">
              {filtered.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isFetching && <Loader2 size={11} className="animate-spin text-amber-500/60" />}
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['intel-feed'] })}
            className="text-xs font-mono text-aegis-text-muted hover:text-amber-400 transition-colors"
            aria-label="Refresh intel feed"
          >
            REFRESH
          </button>
        </div>
      </div>
      <div className="p-2">
        <ErrorBoundary
          fallbackTitle="INTEL FEED ERROR"
          onReset={() => queryClient.invalidateQueries({ queryKey: ['intel-feed'] })}
        >
          <IntelFeedContent />
        </ErrorBoundary>
      </div>
    </section>
  )
}
