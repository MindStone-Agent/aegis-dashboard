interface StatusBadgeProps {
  status: 'ACTIVE' | 'PREPOSITIONING' | 'SILENT' | 'DORMANT' | 'ARCHIVED'
}

// Icon + color redundancy per WCAG SC 1.4.1
const config: Record<StatusBadgeProps['status'], { bg: string; text: string; border: string; label: string; icon: string }> = {
  ACTIVE:         { bg: 'bg-red-500/20',    text: 'text-red-400',    border: 'border-red-500/40',    label: 'ACTIVE',          icon: '▲' },
  PREPOSITIONING: { bg: 'bg-amber-500/20',  text: 'text-amber-400',  border: 'border-amber-500/40',  label: 'PRE-POSITIONING',  icon: '◆' },
  SILENT:         { bg: 'bg-gray-500/20',   text: 'text-gray-400',   border: 'border-gray-500/40',   label: 'SILENT',           icon: '—' },
  DORMANT:        { bg: 'bg-slate-500/20',  text: 'text-slate-400',  border: 'border-slate-500/40',  label: 'DORMANT',          icon: '○' },
  ARCHIVED:       { bg: 'bg-zinc-500/10',   text: 'text-zinc-500',   border: 'border-zinc-500/20',   label: 'ARCHIVED',         icon: '×' },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const c = config[status] ?? config.SILENT
  return (
    <span
      role="status"
      className={`inline-flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 border ${c.bg} ${c.text} ${c.border}`}
    >
      <span aria-hidden="true" className="text-[9px] leading-none">{c.icon}</span>
      {c.label}
    </span>
  )
}
