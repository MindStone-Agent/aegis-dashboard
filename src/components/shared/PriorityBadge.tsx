interface PriorityBadgeProps {
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  pulse?: boolean
}

// Shape + color redundancy per WCAG SC 1.4.1: filled square = HIGH, diamond = MEDIUM, circle = LOW
const config = {
  HIGH:   { color: 'bg-red-500',    text: 'text-red-400',   label: 'HIGH', shape: '■' },
  MEDIUM: { color: 'bg-amber-500',  text: 'text-amber-400', label: 'MED',  shape: '◆' },
  LOW:    { color: 'bg-blue-400',   text: 'text-blue-400',  label: 'LOW',  shape: '○' },
}

export function PriorityBadge({ priority, pulse }: PriorityBadgeProps) {
  const c = config[priority]
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-mono font-semibold ${c.text}`}
      aria-label={`${priority} priority`}
    >
      <span
        className={`inline-block w-2 h-2 rounded-full ${c.color} ${pulse ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      />
      <span aria-hidden="true" className="text-[9px] leading-none">{c.shape}</span>
      {c.label}
    </span>
  )
}
