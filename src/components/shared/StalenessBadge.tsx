import { getStaleness, getStalenessLabel, getStalenessColor } from '../../lib/staleness'
import type { StalenessLevel } from '../../lib/staleness'

interface StalenessBadgeProps {
  updatedAt: string
}

// Icon prefix per WCAG SC 1.4.1: clock fill varies by staleness — fresh=◉, aging=◑, stale=◌
const STALENESS_ICONS: Record<StalenessLevel, string> = {
  fresh: '◉',
  aging: '◑',
  stale: '◌',
}

export function StalenessBadge({ updatedAt }: StalenessBadgeProps) {
  const level = getStaleness(updatedAt)
  const label = getStalenessLabel(level)
  const color = getStalenessColor(level)
  const icon = STALENESS_ICONS[level]

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-mono ${color}`}
      title={`Updated: ${new Date(updatedAt).toLocaleString()}`}
    >
      <span aria-hidden="true" className="text-[9px] leading-none">{icon}</span>
      {label}
    </span>
  )
}
