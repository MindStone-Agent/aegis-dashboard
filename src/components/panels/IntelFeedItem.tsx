import { ChevronRight, ChevronDown, ExternalLink } from 'lucide-react'
import type { IntelFeedEntry } from '../../schemas/intel-feed'
import { PriorityBadge } from '../shared/PriorityBadge'
import { SourceChip } from '../shared/SourceChip'
import { StalenessBadge } from '../shared/StalenessBadge'
import { CveTag } from '../shared/CveTag'
import { DomainBadge } from '../shared/DomainBadge'
import { UrgencyBadge } from '../shared/UrgencyBadge'
import { getStaleness } from '../../lib/staleness'
import type { Domain } from '../../utils/focusFilter'

interface IntelFeedItemProps {
  item: IntelFeedEntry
  isExpanded: boolean
  onToggle: () => void
  isNew?: boolean
  domain?: Domain
}

const PRIORITY_BORDER: Record<string, string> = {
  HIGH:   'border-l-red-500',
  MEDIUM: 'border-l-amber-500',
  LOW:    'border-l-blue-400',
}

export function IntelFeedItem({ item, isExpanded, onToggle, isNew = false, domain }: IntelFeedItemProps) {
  const isHighAndFresh = item.priority === 'HIGH' && getStaleness(item.updatedAt) === 'fresh'
  const borderColor = PRIORITY_BORDER[item.priority]

  return (
    <div className={`border border-aegis-border-panel border-l-4 ${borderColor} bg-aegis-bg-panel hover:bg-aegis-bg-panel-hover transition-colors${isNew ? ' animate-highlight' : ''}`}>
      <button
        className="w-full text-left px-3 py-2.5 flex items-start gap-3"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-label={`${item.priority} priority: ${item.title}`}
      >
        <div className="flex-shrink-0 pt-0.5">
          <PriorityBadge priority={item.priority} pulse={isHighAndFresh} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-sans text-aegis-text-primary leading-snug line-clamp-2 flex-1 min-w-0">
              {item.title}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <SourceChip source={item.source} />
            <StalenessBadge updatedAt={item.updatedAt} />
            {domain && <DomainBadge domain={domain} />}
            {item.urgencyTier && <UrgencyBadge tier={item.urgencyTier} />}
            {item.kevStatus && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-semibold border bg-red-900/20 text-red-300 border-red-700/50">
                KEV
              </span>
            )}
            {item.cves.length > 0 && (
              <span className="text-xs font-mono text-aegis-text-muted">
                {item.cves.length} CVE{item.cves.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 text-aegis-text-muted pt-0.5">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-aegis-border-panel/50">
          <div className="pt-3">
            <h4 className="text-xs font-mono font-semibold text-aegis-text-secondary uppercase tracking-wider mb-1.5">
              OT Relevance
            </h4>
            <p className="text-xs text-aegis-text-primary leading-relaxed">
              {item.otRelevance}
            </p>
          </div>

          {(item.urgencyTier || item.kevStatus || item.epssScore != null || item.cvssScore != null || item.pocAvailable != null) && (
            <div>
              <h4 className="text-xs font-mono font-semibold text-aegis-text-secondary uppercase tracking-wider mb-1.5">
                Exploitation Data
              </h4>
              <div className="flex flex-wrap gap-2 items-center">
                {item.urgencyTier && <UrgencyBadge tier={item.urgencyTier} />}
                {item.kevStatus && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-semibold border bg-red-900/20 text-red-300 border-red-700/50">
                    CISA KEV
                  </span>
                )}
                {item.epssScore != null && (
                  <span className="text-[10px] font-mono text-aegis-text-secondary">
                    EPSS <span className={item.epssScore >= 0.1 ? 'text-red-400 font-semibold' : 'text-amber-400'}>
                      {(item.epssScore * 100).toFixed(1)}%
                    </span>
                  </span>
                )}
                {item.cvssScore != null && (
                  <span className="text-[10px] font-mono text-aegis-text-secondary">
                    CVSS <span className={item.cvssScore >= 9 ? 'text-red-400 font-semibold' : item.cvssScore >= 7 ? 'text-amber-400' : 'text-blue-400'}>
                      {item.cvssScore.toFixed(1)}
                    </span>
                  </span>
                )}
                {item.pocAvailable && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-semibold border bg-orange-900/20 text-orange-300 border-orange-700/50">
                    PoC Public
                  </span>
                )}
              </div>
            </div>
          )}

          {item.analystNote && (
            <div>
              <h4 className="text-xs font-mono font-semibold text-aegis-text-secondary uppercase tracking-wider mb-1.5">
                Analyst Note
              </h4>
              <p className="text-xs text-aegis-text-secondary italic leading-relaxed">
                {item.analystNote}
              </p>
            </div>
          )}

          {item.vendors.length > 0 && (
            <div>
              <h4 className="text-xs font-mono font-semibold text-aegis-text-secondary uppercase tracking-wider mb-1.5">
                Affected Vendors
              </h4>
              <div className="flex flex-wrap gap-1">
                {item.vendors.map(v => (
                  <span key={v} className="text-xs font-mono px-1.5 py-0.5 bg-gray-700/30 text-aegis-text-secondary border border-gray-600/30">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.cves.length > 0 && (
            <div>
              <h4 className="text-xs font-mono font-semibold text-aegis-text-secondary uppercase tracking-wider mb-1.5">
                CVEs
              </h4>
              <div className="flex flex-wrap gap-1">
                {item.cves.map(cve => (
                  <CveTag key={cve} cve={cve} />
                ))}
              </div>
            </div>
          )}

          {item.url && (
            <div className="pt-1">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors"
              >
                <ExternalLink size={11} />
                View Full Advisory
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
