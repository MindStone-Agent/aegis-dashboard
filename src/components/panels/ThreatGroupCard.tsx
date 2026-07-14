import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { ThreatGroupEntry } from '../../schemas/threat-groups'
import { StatusBadge } from '../shared/StatusBadge'
import { ConfidenceBadge } from '../shared/ConfidenceBadge'
import { DomainBadge } from '../shared/DomainBadge'
import { formatDistanceToNow } from 'date-fns'

interface ThreatGroupCardProps {
  group: ThreatGroupEntry
}

const STATUS_BORDER: Record<string, string> = {
  ACTIVE:          'border-l-red-500',
  PREPOSITIONING:  'border-l-amber-500',
  SILENT:          'border-l-gray-500',
}

const SECTOR_COLORS: Record<string, string> = {
  Electric:     'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Pipeline:     'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Water:        'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Petroleum:    'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Chemical:     'bg-red-500/10 text-red-400 border-red-500/20',
  Wastewater:   'bg-teal-500/10 text-teal-400 border-teal-500/20',
  Municipal:    'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Semiconductor:'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Aerospace:    'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'Defense Industrial Base': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  'Natural Gas': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
}

export function ThreatGroupCard({ group }: ThreatGroupCardProps) {
  const [showAllTtps, setShowAllTtps] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const borderColor = STATUS_BORDER[group.status]
  const visibleTtps = showAllTtps ? group.ttps : group.ttps.slice(0, 4)
  const hiddenCount = group.ttps.length - 4

  const lastActivity = (() => {
    try {
      return formatDistanceToNow(new Date(group.lastActivityDate), { addSuffix: true })
    } catch {
      return group.lastActivityDate
    }
  })()

  return (
    <div className={`border border-aegis-border-panel border-l-4 ${borderColor} bg-aegis-bg-panel`}>
      <div className="px-3 py-2.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-mono font-bold text-aegis-text-primary tracking-wider">
                {group.name}
              </span>
              <StatusBadge status={group.status} />
              {group.domain && <DomainBadge domain={group.domain} />}
            </div>
            <div className="text-xs font-mono text-aegis-text-muted mt-0.5">{group.nexus}</div>
          </div>
          <ConfidenceBadge confidence={group.confidence} />
        </div>

        {group.targetSectors.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {group.targetSectors.map(s => {
              const color = SECTOR_COLORS[s] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
              return (
                <span key={s} className={`text-xs font-mono px-1.5 py-0.5 border ${color}`}>
                  {s}
                </span>
              )
            })}
          </div>
        )}

        <div className="space-y-1 mb-2">
          {visibleTtps.map((ttp, i) => (
            <div key={i} className="text-xs font-mono text-aegis-text-secondary leading-relaxed">
              <span className="text-aegis-text-muted mr-1">›</span>
              <span className="break-words">{ttp}</span>
            </div>
          ))}
          {!showAllTtps && hiddenCount > 0 && (
            <button
              onClick={() => setShowAllTtps(true)}
              className="text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors"
            >
              +{hiddenCount} more TTPs
            </button>
          )}
          {showAllTtps && hiddenCount > 0 && (
            <button
              onClick={() => setShowAllTtps(false)}
              className="text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors"
            >
              Show fewer
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span
            className="text-xs font-mono text-aegis-text-muted"
            title={`Last activity: ${new Date(group.lastActivityDate).toLocaleDateString()}`}
          >
            Last seen: {lastActivity}
          </span>
          {group.notes && (
            <button
              onClick={() => setShowNotes(v => !v)}
              className="flex items-center gap-1 text-xs font-mono text-aegis-text-muted hover:text-aegis-text-secondary transition-colors"
              aria-expanded={showNotes}
            >
              {showNotes ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              Notes
            </button>
          )}
        </div>

        {showNotes && group.notes && (
          <div className="mt-2 pt-2 border-t border-aegis-border-panel/50">
            <p className="text-xs font-sans text-aegis-text-secondary leading-relaxed">{group.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
