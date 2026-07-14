interface ConfidenceBadgeProps {
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'SPECULATIVE'
}

// Icon prefix per WCAG SC 1.4.1: icon provides redundant non-color differentiator
// ● = HIGH (filled), ◐ = MEDIUM (half), ○ = LOW (empty), ? = SPECULATIVE
const config = {
  HIGH:        { text: 'text-green-400',  label: 'HIGH CONF',   icon: '●' },
  MEDIUM:      { text: 'text-amber-400',  label: 'MED CONF',    icon: '◐' },
  LOW:         { text: 'text-blue-400',   label: 'LOW CONF',    icon: '○' },
  SPECULATIVE: { text: 'text-gray-400',   label: 'SPECULATIVE', icon: '?' },
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const c = config[confidence]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono ${c.text}`}>
      <span aria-hidden="true" className="text-[9px] leading-none">{c.icon}</span>
      {c.label}
    </span>
  )
}
