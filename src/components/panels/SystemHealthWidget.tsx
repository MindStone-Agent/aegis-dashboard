import { useState, useId } from 'react'
import { useSystemHealth } from '../../hooks/useSystemHealth'
import { BrainCircuit, Database, Search, Cpu, Clock } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import type { ApiStatus } from '../../schemas/system-health'

type ApiStatusValue = 'OK' | 'DEGRADED' | 'ERROR' | 'UNKNOWN'

const API_STATUS_COLORS: Record<ApiStatusValue, string> = {
  OK:      'bg-green-400',
  DEGRADED:'bg-yellow-400',
  ERROR:   'bg-red-500',
  UNKNOWN: 'bg-gray-500',
}

interface TooltipProps {
  content: string
  children: React.ReactNode
}

function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const tooltipId = useId()

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      // tabIndex makes the wrapper focusable so keyboard users can trigger the tooltip
      tabIndex={0}
      aria-describedby={visible ? tooltipId : undefined}
    >
      {children}
      {visible && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-aegis-bg-overlay border border-aegis-border-panel text-xs font-mono text-aegis-text-secondary whitespace-nowrap z-50 pointer-events-none"
        >
          {content}
        </div>
      )}
    </div>
  )
}

function ApiDot({ name, apiStatus }: { name: string; apiStatus: ApiStatus | undefined }) {
  const status: ApiStatusValue = apiStatus?.status ?? 'UNKNOWN'
  const dotColor = API_STATUS_COLORS[status]
  const tooltipText = apiStatus
    ? `${status} — last checked ${format(new Date(apiStatus.lastChecked), 'HH:mm:ss')}${apiStatus.errorMessage ? ` — ${apiStatus.errorMessage}` : ''}`
    : 'Unknown'

  return (
    <Tooltip content={tooltipText}>
      <div className="flex items-center gap-1.5 cursor-default">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} aria-label={`${name} API status: ${status}`} />
        <span className="text-xs font-mono text-aegis-text-secondary">{name}</span>
      </div>
    </Tooltip>
  )
}

function Divider() {
  return <div className="w-px h-4 bg-aegis-border-panel mx-1" aria-hidden="true" />
}

export function SystemHealthWidget() {
  const { data } = useSystemHealth()

  const dreamText = data?.lastDreamCycle
    ? `${formatDistanceToNow(new Date(data.lastDreamCycle.runAt), { addSuffix: true })}`
    : '--'

  const dreamTooltip = data?.lastDreamCycle
    ? `Dream cycle: ${format(new Date(data.lastDreamCycle.runAt), 'yyyy-MM-dd HH:mm:ss')} · Status: ${data.lastDreamCycle.status}`
    : 'No dream cycle data'

  const vectorText = data?.vectorStore
    ? data.vectorStore.totalDocuments.toLocaleString() + ' chunks'
    : '--'

  const vectorTooltip = data?.vectorStore
    ? `${data.vectorStore.totalDocuments.toLocaleString()} chunks · Updated: ${format(new Date(data.vectorStore.lastUpdated), 'HH:mm:ss')}`
    : 'No vector store data'

  const braveRemaining = data?.braveSearch?.estimatedQueriesRemaining ?? null
  const braveQuota = data?.braveSearch?.dailyQuota ?? 500
  const braveText = braveRemaining !== null ? `${braveRemaining}/${braveQuota} remaining` : '--'
  const braveTooltip = data?.braveSearch
    ? `Brave Search: ${data.braveSearch.queriesUsedToday} used · ${data.braveSearch.estimatedQueriesRemaining} remaining of ${data.braveSearch.dailyQuota}`
    : 'No Brave Search data'
  const braveColor = braveRemaining !== null && braveRemaining === 0 ? 'text-red-400' : 'text-aegis-text-secondary'

  const updatedAt = data?.updatedAt
    ? format(new Date(data.updatedAt), 'HH:mm:ss')
    : '--'

  return (
    <div className="h-full flex items-center gap-0 px-3 overflow-x-auto">
      <Tooltip content={dreamTooltip}>
        <div className="flex items-center gap-1.5 cursor-default flex-shrink-0">
          <BrainCircuit size={11} className="text-amber-500/70" />
          <span className="text-xs font-mono text-aegis-text-secondary hidden sm:inline">DREAM</span>
          <span className="text-xs font-mono text-aegis-text-muted">{dreamText}</span>
        </div>
      </Tooltip>

      <Divider />

      <Tooltip content={vectorTooltip}>
        <div className="flex items-center gap-1.5 cursor-default flex-shrink-0">
          <Database size={11} className="text-blue-400/70" />
          <span className="text-xs font-mono text-aegis-text-secondary hidden sm:inline">VECTORS</span>
          <span className="text-xs font-mono text-aegis-text-muted">{vectorText}</span>
        </div>
      </Tooltip>

      <Divider />

      <Tooltip content={braveTooltip}>
        <div className="flex items-center gap-1.5 cursor-default flex-shrink-0">
          <Search size={11} className={braveRemaining === 0 ? 'text-red-400' : 'text-green-400/70'} />
          <span className="text-xs font-mono text-aegis-text-secondary hidden sm:inline">BRAVE</span>
          <span className={`text-xs font-mono ${braveColor}`}>{braveText}</span>
        </div>
      </Tooltip>

      <Divider />

      <div className="flex items-center gap-3 flex-shrink-0">
        <Cpu size={11} className="text-aegis-text-muted" />
        <ApiDot name="ANTHROPIC" apiStatus={data?.apis.anthropic} />
        {data?.apis.openai && (
          <ApiDot name="OPENAI" apiStatus={data.apis.openai} />
        )}
      </div>

      <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
        <Clock size={10} className="text-aegis-text-muted" />
        <span className="text-xs font-mono text-aegis-text-muted">{updatedAt}</span>
      </div>
    </div>
  )
}
