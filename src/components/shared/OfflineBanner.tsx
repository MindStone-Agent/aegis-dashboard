import { WifiOff } from 'lucide-react'

interface OfflineBannerProps {
  cachedAt: Date | null
}

export function OfflineBanner({ cachedAt }: OfflineBannerProps) {
  const timestamp = cachedAt
    ? cachedAt.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'unknown'

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 text-amber-400 text-xs font-mono flex-shrink-0"
    >
      <WifiOff size={12} className="flex-shrink-0" />
      <span>
        Offline — showing cached data from {timestamp}
      </span>
    </div>
  )
}
