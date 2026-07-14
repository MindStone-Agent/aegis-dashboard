type UrgencyTier = 'ACT_NOW' | 'PLAN_PATCH' | 'MONITOR'

interface UrgencyBadgeProps {
  tier: UrgencyTier
}

const TIER_CONFIG: Record<UrgencyTier, { label: string; classes: string }> = {
  ACT_NOW:    { label: 'Act Now',    classes: 'bg-red-500/15 text-red-400 border-red-500/40' },
  PLAN_PATCH: { label: 'Plan Patch', classes: 'bg-amber-500/15 text-amber-400 border-amber-500/40' },
  MONITOR:    { label: 'Monitor',    classes: 'bg-blue-500/15 text-blue-400 border-blue-500/40' },
}

export function UrgencyBadge({ tier }: UrgencyBadgeProps) {
  const { label, classes } = TIER_CONFIG[tier]
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-semibold border ${classes}`}>
      {label}
    </span>
  )
}
