import { useUIStore } from '../../store/uiStore'
import type { FocusMode } from '../../utils/focusFilter'
import { useAgentFocusMode } from '../../hooks/useAgentFocusMode'

interface ModeConfig {
  value: FocusMode
  label: string
  tooltip: string
}

const MODES: ModeConfig[] = [
  {
    value: 'OT_ONLY',
    label: 'OT Only',
    tooltip: 'Show only OT/ICS-specific threats and advisories',
  },
  {
    value: 'CONVERGED',
    label: 'Converged',
    tooltip: 'OT-primary + IT threats that cross into OT attack paths (recommended)',
  },
  {
    value: 'BROAD',
    label: 'Broad',
    tooltip: 'Full cyber landscape — all IT, enterprise, and nation-state activity',
  },
]

export function FocusToggle() {
  const focusMode = useUIStore(s => s.focusMode)
  const setFocusMode = useUIStore(s => s.setFocusMode)
  const agentMode = useAgentFocusMode()

  const showMismatchWarning =
    focusMode === 'BROAD' &&
    agentMode !== null &&
    agentMode === 'OT_ONLY'

  return (
    <div className="flex flex-col items-end gap-1">
      <div
        className="flex items-center border border-aegis-border-panel"
        role="group"
        aria-label="Focus mode"
      >
        {MODES.map((mode, idx) => {
          const isActive = focusMode === mode.value
          const isFirst = idx === 0
          const isLast = idx === MODES.length - 1
          return (
            <button
              key={mode.value}
              onClick={() => setFocusMode(mode.value)}
              title={mode.tooltip}
              aria-pressed={isActive}
              aria-label={`Focus mode: ${mode.label} — ${mode.tooltip}`}
              className={[
                'px-2.5 py-1 text-xs font-mono transition-colors',
                !isFirst ? 'border-l border-aegis-border-panel' : '',
                !isLast ? '' : '',
                isActive
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-aegis-bg-base text-aegis-text-muted hover:text-aegis-text-secondary hover:bg-aegis-bg-panel-hover',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {mode.label}
            </button>
          )
        })}
      </div>
      {showMismatchWarning && (
        <span
          className="text-[10px] font-mono text-amber-500/80 leading-none"
          title="Agent last pulled in OT_ONLY mode — broad data may be incomplete"
        >
          ⚠ Agent pull was OT-only — broad data may be incomplete
        </span>
      )}
    </div>
  )
}
