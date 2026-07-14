import type { Domain } from '../../utils/focusFilter'

interface DomainBadgeProps {
  domain: Domain
}

const BADGE_CONFIG: Record<Domain, { label: string; className: string }> = {
  OT:   { label: 'OT',    className: 'bg-amber-900/40 text-amber-400 border-amber-700' },
  IT:   { label: 'IT',    className: 'bg-blue-900/40 text-blue-400 border-blue-700' },
  BOTH: { label: 'OT+IT', className: 'bg-purple-900/40 text-purple-400 border-purple-700' },
}

export function DomainBadge({ domain }: DomainBadgeProps) {
  const config = BADGE_CONFIG[domain]
  return (
    <span
      className={`inline-flex items-center text-xs px-1.5 py-0.5 border font-mono ${config.className}`}
      title={`Domain: ${config.label}`}
      aria-label={`Domain: ${config.label}`}
    >
      {config.label}
    </span>
  )
}
