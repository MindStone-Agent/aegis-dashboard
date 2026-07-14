interface SkeletonPanelProps {
  variant: 'intel-feed' | 'threat-group-card' | 'investigation' | 'daily-summary' | 'agent-activity'
}

export function SkeletonPanel({ variant }: SkeletonPanelProps) {
  if (variant === 'intel-feed') {
    return (
      <div className="bg-aegis-bg-panel border border-aegis-border-panel p-3 space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-gray-700/60 animate-pulse" />
          <div className="h-3 bg-gray-700/40 w-16 animate-pulse" />
          <div className="h-3 bg-gray-700/40 flex-1 animate-pulse" />
          <div className="h-3 bg-gray-700/40 w-12 animate-pulse" />
        </div>
        <div className="h-2 bg-gray-700/30 w-3/4 animate-pulse" />
      </div>
    )
  }

  if (variant === 'threat-group-card') {
    return (
      <div className="bg-aegis-bg-panel border border-aegis-border-panel border-l-4 border-l-gray-700 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-700/40 w-28 animate-pulse" />
          <div className="h-5 bg-gray-700/40 w-20 animate-pulse" />
        </div>
        <div className="h-2 bg-gray-700/30 w-1/2 animate-pulse" />
        <div className="flex gap-1">
          <div className="h-4 bg-gray-700/30 w-12 animate-pulse" />
          <div className="h-4 bg-gray-700/30 w-16 animate-pulse" />
          <div className="h-4 bg-gray-700/30 w-10 animate-pulse" />
        </div>
        <div className="space-y-1">
          <div className="h-2 bg-gray-700/30 w-full animate-pulse" />
          <div className="h-2 bg-gray-700/30 w-5/6 animate-pulse" />
          <div className="h-2 bg-gray-700/30 w-4/5 animate-pulse" />
        </div>
      </div>
    )
  }

  if (variant === 'investigation') {
    return (
      <div className="bg-aegis-bg-panel border border-aegis-border-panel p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-700/40 w-48 animate-pulse" />
          <div className="h-4 bg-gray-700/30 w-16 animate-pulse" />
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex-1 h-2 bg-gray-700/30 animate-pulse" />
          ))}
        </div>
        <div className="h-2 bg-gray-700/30 w-2/3 animate-pulse" />
      </div>
    )
  }

  if (variant === 'agent-activity') {
    return (
      <div className="space-y-px">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-aegis-bg-panel border-b border-aegis-border-panel/50 px-3 py-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-gray-700/50 animate-pulse" />
              <div className="h-3 bg-gray-700/40 w-14 animate-pulse" />
              <div className="h-3 bg-gray-700/30 flex-1 animate-pulse" />
              <div className="h-3 bg-gray-700/30 w-10 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-aegis-bg-panel border border-aegis-border-panel p-4 space-y-4">
      <div className="h-6 bg-gray-700/40 w-32 animate-pulse" />
      <div className="space-y-2">
        <div className="h-2 bg-gray-700/30 w-full animate-pulse" />
        <div className="h-2 bg-gray-700/30 w-5/6 animate-pulse" />
        <div className="h-2 bg-gray-700/30 w-4/5 animate-pulse" />
      </div>
    </div>
  )
}
