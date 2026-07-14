import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Settings, Shield } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { useIntelFeed } from '../../hooks/useIntelFeed'
import { useThreatGroups } from '../../hooks/useThreatGroups'
import { useInvestigations } from '../../hooks/useInvestigations'
import { useDailySummary } from '../../hooks/useDailySummary'
import { useSystemHealth } from '../../hooks/useSystemHealth'
import { format } from 'date-fns'
import { useState } from 'react'
import { SETTINGS_ENABLED } from '../../lib/feature-flags'
import { FocusToggle } from '../shared/FocusToggle'

function getMaxUpdatedAt(dates: (string | undefined)[]): Date | null {
  const valid = dates.filter(Boolean).map(d => new Date(d!).getTime()).filter(n => !isNaN(n))
  if (valid.length === 0) return null
  return new Date(Math.max(...valid))
}

export function TopNav() {
  const queryClient = useQueryClient()
  const setSettingsPanelOpen = useUIStore(s => s.setSettingsPanelOpen)
  const unreadHighCount = useUIStore(s => s.unreadHighCount)
  const [refreshing, setRefreshing] = useState(false)

  const { data: intelFeed } = useIntelFeed()
  const { data: threatGroups } = useThreatGroups()
  const { data: investigations } = useInvestigations()
  const { data: dailySummary } = useDailySummary()
  const { data: systemHealth } = useSystemHealth()

  const maxDate = getMaxUpdatedAt([
    intelFeed?.[0]?.updatedAt,
    threatGroups?.[0]?.updatedAt,
    investigations?.[0]?.updatedAt,
    dailySummary?.[0]?.createdAt,
    systemHealth?.updatedAt,
  ])

  const handleRefresh = async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries()
    setTimeout(() => setRefreshing(false), 1000)
  }

  return (
    <header className="h-topnav flex items-center justify-between px-4 border-b border-aegis-border-panel bg-aegis-bg-panel z-50 flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Shield icon with pulsing amber ring when unread HIGH items exist */}
        <div className="relative flex-shrink-0">
          <Shield size={18} className="text-amber-500" />
          {unreadHighCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[9px] font-mono font-bold bg-red-500 text-white animate-pulse"
              aria-label={`${unreadHighCount} unread HIGH priority intel alert${unreadHighCount > 1 ? 's' : ''}`}
              title={`${unreadHighCount} unread HIGH priority intel item${unreadHighCount > 1 ? 's' : ''} — scroll to Intel Feed`}
            >
              {unreadHighCount > 9 ? '9+' : unreadHighCount}
            </span>
          )}
        </div>
        <div>
          <span className="text-sm font-mono font-bold text-aegis-text-primary tracking-widest">AEGIS</span>
          <span className="hidden sm:inline text-xs font-mono text-aegis-text-muted ml-2 tracking-wider">
            OT/ICS THREAT INTELLIGENCE
          </span>
        </div>
        {maxDate && (
          <div className="hidden lg:flex items-center gap-1.5 ml-4 text-xs font-mono text-aegis-text-muted">
            <span className="text-aegis-text-secondary">UPDATED</span>
            <span>{format(maxDate, 'yyyy-MM-dd HH:mm:ss')}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <FocusToggle />
        <button
          onClick={handleRefresh}
          title="Refresh all data (R)"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-aegis-text-secondary hover:text-amber-400 border border-aegis-border-panel hover:border-amber-500/40 transition-colors"
          aria-label="Refresh all data"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">REFRESH</span>
        </button>
        {SETTINGS_ENABLED && (
          <button
            onClick={() => setSettingsPanelOpen(true)}
            title="Settings"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-aegis-text-secondary hover:text-amber-400 border border-aegis-border-panel hover:border-amber-500/40 transition-colors"
            aria-label="Open settings"
          >
            <Settings size={12} />
            <span className="hidden sm:inline">SETTINGS</span>
          </button>
        )}
      </div>
    </header>
  )
}
