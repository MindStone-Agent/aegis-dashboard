import { useState, useRef, useCallback, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useUIStore } from '../store/uiStore'
import { demoConversation, type DemoMessage } from '../lib/demoConversation'

// ---------------------------------------------------------------------------
// localStorage persistence helpers (live mode only)
// ---------------------------------------------------------------------------

const STORAGE_SESSION_KEY = 'aegis-chat-session-key'
const STORAGE_MESSAGES_PREFIX = 'aegis-chat-messages-'
const STORAGE_DRAFT_KEY = 'aegis-chat-draft'
const DRAFT_TTL_MS = 5 * 60 * 1000 // 5 minutes

function getPersistedSessionKey(): string | null {
  try { return localStorage.getItem(STORAGE_SESSION_KEY) } catch { return null }
}
function persistSessionKey(key: string): void {
  try { localStorage.setItem(STORAGE_SESSION_KEY, key) } catch { /* ignore storage errors */ }
}
function getPersistedMessages(key: string): Message[] | null {
  try { const r = localStorage.getItem(STORAGE_MESSAGES_PREFIX + key); return r ? JSON.parse(r) : null } catch { return null }
}
function persistMessages(key: string, msgs: Message[]): void {
  try { localStorage.setItem(STORAGE_MESSAGES_PREFIX + key, JSON.stringify(msgs)) } catch { /* ignore storage errors */ }
}
function clearPersistedMessages(key: string): void {
  try { localStorage.removeItem(STORAGE_MESSAGES_PREFIX + key); localStorage.removeItem(STORAGE_SESSION_KEY) } catch { /* ignore storage errors */ }
}

// Draft persistence — survives mid-stream refresh
function saveDraft(sessionKey: string, agentId: string, content: string): void {
  try {
    localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify({
      sessionKey, agentId, content, timestamp: Date.now(),
    }))
  } catch { /* ignore */ }
}
function clearDraft(): void {
  try { localStorage.removeItem(STORAGE_DRAFT_KEY) } catch { /* ignore */ }
}
function getRestoredDraft(sessionKey: string): { agentId: string; content: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_DRAFT_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw)
    if (draft.sessionKey !== sessionKey) { clearDraft(); return null }
    if (Date.now() - draft.timestamp > DRAFT_TTL_MS) { clearDraft(); return null }
    return { agentId: draft.agentId, content: draft.content }
  } catch { return null }
}

// Returns initial messages, restoring any interrupted draft from a prior session
function getInitialMessages(isDemoMode: boolean, sessionKey: string, demoMsgs: Message[]): Message[] {
  if (isDemoMode) return demoMsgs
  const persisted = getPersistedMessages(sessionKey) ?? []
  const draft = getRestoredDraft(sessionKey)
  if (draft) {
    clearDraft()
    const interruptedMsg: Message = {
      id: draft.agentId,
      role: 'agent',
      content: draft.content + '\n\n*[stream interrupted — partial response]*',
      streaming: false,
      interrupted: true,
      timestamp: new Date().toISOString(),
    }
    return [...persisted, interruptedMsg]
  }
  return persisted
}

export interface Message {
  id: string
  role: 'user' | 'agent'
  content: string
  streaming?: boolean
  interrupted?: boolean
  timestamp: string
}

export interface ChatSession {
  id: string
  title: string
  updatedAt: string
  messageCount: number
}

export interface UseStreamingChatReturn {
  messages: Message[]
  streaming: boolean
  error: string | null
  isDemoMode: boolean
  sessions: ChatSession[]
  sessionsLoading: boolean
  activeSessionId: string | null
  sendMessage: (content: string) => Promise<void>
  cancelStream: () => void
  clearMessages: () => void
  loadSession: (sessionId: string) => Promise<void>
  /** Register a callback fired for each streamed token (for TTS). Pass null to clear. */
  setTokenCallback: (cb: ((token: string) => void) | null) => void
  /** Called when streaming ends (for TTS flush). */
  setStreamEndCallback: (cb: (() => void) | null) => void
}

// ---------------------------------------------------------------------------
// Demo mode static data
// ---------------------------------------------------------------------------

const DEMO_SESSIONS: ChatSession[] = [
  {
    id: 'demo-session-1',
    title: 'VOLTZITE S7-1500 Analysis',
    updatedAt: '2026-03-18T08:53:00.000Z',
    messageCount: 4,
  },
  {
    id: 'demo-session-2',
    title: 'GRAPHITE Phishing Campaign IOCs',
    updatedAt: '2026-03-17T14:22:00.000Z',
    messageCount: 6,
  },
  {
    id: 'demo-session-3',
    title: 'Dragos Advisory DRAG-2026-0028 Review',
    updatedAt: '2026-03-16T09:10:00.000Z',
    messageCount: 3,
  },
]

const DEMO_SESSION_MESSAGES: Record<string, Message[]> = {
  'demo-session-1': demoConversation.map((dm: DemoMessage) => ({
    id: dm.id,
    role: dm.role,
    content: dm.content,
    timestamp: dm.timestamp,
  })),
  'demo-session-2': [
    {
      id: 'gs2-1',
      role: 'user',
      content: 'Summarize the GRAPHITE phishing campaign IOCs from the latest Dragos advisory.',
      timestamp: '2026-03-17T14:18:00.000Z',
    },
    {
      id: 'gs2-2',
      role: 'agent',
      content: `## GRAPHITE Phishing Campaign — IOC Summary

**Advisory:** Dragos DRAG-2026-0027 | **TLP:** AMBER

GRAPHITE has been observed targeting engineering workstations at North American energy utilities using spear-phishing lures themed around ICS firmware update notifications.

### Network Indicators
| Type | Value | Confidence |
|------|-------|-----------|
| C2 Domain | update-siemens[.]net | HIGH |
| C2 Domain | ics-firmware[.]com | HIGH |
| IP Address | 185.220.101[.]47 | MEDIUM |
| IP Address | 45.142.212[.]100 | MEDIUM |

### File Indicators
- \`SHA256: 3a4b5c...d1e2f3\` — SiemensUpdate_v4.2.exe (dropper)
- \`SHA256: 7f8a9b...c0d1e2\` — winupd32.dll (persistence component)

### Recommended Actions
1. Block listed C2 domains at perimeter DNS
2. Hunt for dropper hash in endpoint telemetry
3. Review engineering workstation email logs for lure subjects matching "Firmware Update Required"`,
      timestamp: '2026-03-17T14:19:00.000Z',
    },
    {
      id: 'gs2-3',
      role: 'user',
      content: 'Which of our threat groups in the tracker have overlapping TTPs with GRAPHITE?',
      timestamp: '2026-03-17T14:20:00.000Z',
    },
    {
      id: 'gs2-4',
      role: 'agent',
      content: `## GRAPHITE TTP Overlap Analysis

Cross-referencing GRAPHITE TTPs (ICS ATT&CK T0865, T0886, T0849) against tracked threat groups:

**HIGH overlap — VOLTZITE:** Both groups share spear-phishing initial access (T0865) and Living-off-the-Land (LotL) lateral movement techniques. VOLTZITE is assessed as a separate actor but has been observed operating in environments previously compromised by GRAPHITE.

**MEDIUM overlap — SANDWORM:** Overlapping use of destructive wipers post-exfiltration (T0809). GRAPHITE's persistence mechanisms mirror Sandworm's Industroyer2 loader patterns.

**LOW overlap — BAUXITE, LAURIONITE:** Minimal TTP overlap; different target sectors and geographies.

Recommend prioritizing VOLTZITE and SANDWORM hunt activities in parallel with GRAPHITE IOC blocking.`,
      timestamp: '2026-03-17T14:21:00.000Z',
    },
    {
      id: 'gs2-5',
      role: 'user',
      content: 'Generate a Snort rule for the C2 domains.',
      timestamp: '2026-03-17T14:21:30.000Z',
    },
    {
      id: 'gs2-6',
      role: 'agent',
      content: `## Snort Rules — GRAPHITE C2 Detection

\`\`\`
# GRAPHITE C2 Domain Detection Rules
# Reference: Dragos DRAG-2026-0027

alert dns any any -> any 53 (
  msg:"AEGIS GRAPHITE C2 DNS Lookup - update-siemens.net";
  dns.query; content:"update-siemens.net";
  nocase; classtype:trojan-activity;
  sid:9002001; rev:1;
)

alert dns any any -> any 53 (
  msg:"AEGIS GRAPHITE C2 DNS Lookup - ics-firmware.com";
  dns.query; content:"ics-firmware.com";
  nocase; classtype:trojan-activity;
  sid:9002002; rev:1;
)

alert tcp $HOME_NET any -> 185.220.101.47 any (
  msg:"AEGIS GRAPHITE C2 IP Contact";
  flags:S; classtype:trojan-activity;
  sid:9002003; rev:1;
)
\`\`\`

Deploy at perimeter IDS sensors with DNS visibility enabled.`,
      timestamp: '2026-03-17T14:22:00.000Z',
    },
  ],
  'demo-session-3': [
    {
      id: 'gs3-1',
      role: 'user',
      content: 'Review Dragos advisory DRAG-2026-0028 and assess impact on our environment.',
      timestamp: '2026-03-16T09:06:00.000Z',
    },
    {
      id: 'gs3-2',
      role: 'agent',
      content: `## DRAG-2026-0028 — Environment Impact Assessment

**Advisory Title:** Schneider Electric EcoStruxure Authentication Bypass
**CVE:** CVE-2026-11842 | **CVSS:** 8.6 (High)

### Vulnerability Summary
An authentication bypass in EcoStruxure Operator Terminal Expert v3.3 and earlier allows unauthenticated remote code execution on HMI panels via the proprietary Modbus-over-TCP service (TCP/502).

### Environment Exposure
Based on your system health data:
- **SCADA Historian**: Running EcoStruxure v3.1 — **VULNERABLE**
- **Field HMI panels**: 3 units identified in asset inventory — **PATCH STATUS UNKNOWN**

### Recommended Immediate Actions
1. Audit all EcoStruxure deployments for version 3.3 and below
2. Firewall TCP/502 at OT DMZ boundary pending patch
3. Apply vendor patch SE-2026-0028 — available as of 2026-03-14

**Risk Rating: HIGH** — CVSS 8.6 with confirmed external network path to historian.`,
      timestamp: '2026-03-16T09:08:00.000Z',
    },
    {
      id: 'gs3-3',
      role: 'user',
      content: 'What is the patching priority relative to CVE-2024-43647?',
      timestamp: '2026-03-16T09:09:00.000Z',
    },
    {
      id: 'gs3-4',
      role: 'agent',
      content: `## Patch Priority Comparison

| CVE | CVSS | Exploitation Status | Threat Actor | Priority |
|-----|------|--------------------|--------------|----|
| CVE-2024-43647 | 9.8 | Weaponization imminent (VOLTZITE) | VOLTZITE | P1 — Emergency |
| CVE-2026-11842 | 8.6 | No known exploitation | Unknown | P2 — High |

**Recommendation:** Patch CVE-2024-43647 (S7-1500) first — the VOLTZITE attribution and active IDS alerting in INV-001 make this an emergency maintenance window. Schedule CVE-2026-11842 remediation within 72 hours after P1 is resolved.`,
      timestamp: '2026-03-16T09:10:00.000Z',
    },
  ],
}

function demoToMessage(dm: DemoMessage): Message {
  return { id: dm.id, role: dm.role, content: dm.content, timestamp: dm.timestamp }
}

// ---------------------------------------------------------------------------
// Hook — REST/SSE implementation against MindStone gateway /v1/chat/completions
// ---------------------------------------------------------------------------

export function useStreamingChat(): UseStreamingChatReturn {
  const settings = useUIStore(s => s.settings)

  // Demo mode: no gateway URL configured
  const isDemoMode = !settings.openWebuiUrl || settings.openWebuiUrl.trim() === ''

  // Restore persisted session key and messages on first mount (live mode only)
  const restoredSessionKey = !isDemoMode ? (getPersistedSessionKey() ?? uuidv4()) : uuidv4()

  const [messages, setMessages] = useState<Message[]>(
    () => getInitialMessages(isDemoMode, restoredSessionKey, demoConversation.map(demoToMessage))
  )
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>(isDemoMode ? DEMO_SESSIONS : [])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    isDemoMode ? 'demo-session-1' : null
  )
  const abortRef = useRef<AbortController | null>(null)
  const sessionIdRef = useRef<string>(restoredSessionKey)
  const tokenCallbackRef = useRef<((token: string) => void) | null>(null)
  const streamEndCallbackRef = useRef<(() => void) | null>(null)

  const setTokenCallback = useCallback((cb: ((token: string) => void) | null) => {
    tokenCallbackRef.current = cb
  }, [])

  const setStreamEndCallback = useCallback((cb: (() => void) | null) => {
    streamEndCallbackRef.current = cb
  }, [])

  // Persist session key once on mount (live mode only)
  useEffect(() => {
    if (!isDemoMode) {
      persistSessionKey(sessionIdRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Session list — not supported by MindStone gateway v1 REST; stub empty.
  useEffect(() => {
    if (isDemoMode) return
    setSessions([])
    setSessionsLoading(false)
  }, [isDemoMode])

  // Persist messages to localStorage after each change (live mode only, skip during streaming)
  useEffect(() => {
    if (isDemoMode) return
    if (streaming) return
    persistMessages(sessionIdRef.current, messages)
  }, [messages, streaming, isDemoMode])

  // Strip MindStone system annotations injected into message content before
  // sending as history — prevents gateway from seeing internal routing tags.
  const stripSystemAnnotations = (content: string): string =>
    content
      .replace(/\[Current message - respond to this\]/gi, '')
      .replace(/\[reply_to[^\]]*\]/gi, '')
      .replace(/\[System Message\][^\n]*/gi, '')
      .replace(/\*\[stream interrupted[^\]]*\]\*/gi, '')
      .trim()

  const buildHistory = useCallback((msgs: Message[], newContent: string) => {
    const history = msgs
      .filter(m => !m.interrupted) // skip interrupted/partial messages
      .map(m => ({
        role: m.role === 'agent' ? 'assistant' : 'user',
        content: stripSystemAnnotations(m.content),
      }))
      .filter(m => m.content.length > 0) // skip empty after stripping
    return [...history, { role: 'user', content: newContent }]
  }, [])

  // ---------------------------------------------------------------------------
  // Slash command handler — resolved client-side, never sent to gateway
  // ---------------------------------------------------------------------------
  const handleSlashCommand = useCallback(async (input: string): Promise<string> => {
    const parts = input.trim().split(/\s+/)
    const base = parts[0].toLowerCase()

    switch (base) {
      case '/help':
        return `**Aegis Dashboard — Slash Commands**

\`/status\` — System health, context window, vector store, API status
\`/focus\` — Show active focus mode
\`/investigations\` — List open investigations
\`/activity\` — Recent agent activity (last 10 events)
\`/alerts\` — Active high/critical alerts and KEV deadlines
\`/dream_cycle\` — Run the dream cycle — vectorize transcripts and memory docs into LanceDB 🌙
\`/clear\` — Clear current conversation
\`/help\` — Show this message`

      case '/status': {
        try {
          const [healthRes, focusRes] = await Promise.all([
            fetch('/data/system-health.json'),
            fetch('/data/focus-mode.json'),
          ])
          const health = await healthRes.json()
          const focus = await focusRes.json()
          const cw = health.contextWindow ?? {}
          const pct = cw.utilizationPct ?? null
          const bar = pct != null
            ? `[${'█'.repeat(Math.round(pct / 10))}${'░'.repeat(10 - Math.round(pct / 10))}] ${pct}%`
            : 'N/A'
          return `**System Status** — ${new Date().toUTCString()}

| Field | Value |
|---|---|
| Model | ${cw.model ?? 'claude-sonnet-4-6'} |
| Context tokens | ${cw.currentTokens?.toLocaleString() ?? '?'} / ${(cw.maxTokens ?? 200000).toLocaleString()} |
| Utilization | ${bar} |
| Compactions (lifetime) | ${cw.compactions?.lifetime ?? 0} |
| Last compaction | ${cw.compactions?.lastAt ?? 'None'} |
| Vectors | ${health.vectorStore?.totalDocuments ?? '?'} |
| Focus mode | ${focus?.mode ?? 'CONVERGED'} |
| Brave API remaining | ${health.braveSearch?.estimatedQueriesRemaining ?? '?'} / ${health.braveSearch?.dailyQuota ?? 2000} |
| Last updated | ${health.updatedAt ?? 'Unknown'} |`
        } catch {
          return '**Error:** Could not fetch system health data.'
        }
      }

      case '/focus': {
        try {
          const res = await fetch('/data/focus-mode.json')
          const data = await res.json()
          return `**Active focus mode:** \`${data.mode ?? 'CONVERGED'}\`

| Mode | Description |
|---|---|
| \`OT_ONLY\` | ICS advisories, ICS-specific groups, Level 1-2 TTPs only |
| \`CONVERGED\` | OT-primary with IT context included for kill-chain visibility *(default)* |
| \`BROAD\` | Full cyber landscape — APT, ransomware, enterprise CVEs |

To change: ask Aegis directly ("Set focus mode to BROAD").`
        } catch {
          return '**Error:** Could not fetch focus mode.'
        }
      }

      case '/investigations': {
        try {
          const res = await fetch('/data/investigations.json')
          const data = await res.json() as Array<{
            id: string; scenarioName: string; status: string; stage: string; sector: string; createdAt: string
          }>
          const open = data.filter(i => i.status !== 'CLOSED' && i.status !== 'RESOLVED')
          if (!open.length) return '**No open investigations.**'
          const rows = open.map(i =>
            `| ${i.id} | ${i.stage ?? '—'} | ${(i.scenarioName ?? i.id).substring(0, 50)} | ${(i.createdAt ?? '').split('T')[0]} |`
          ).join('\n')
          return `**Open Investigations** (${open.length} of ${data.length} total)\n\n| ID | Stage | Title | Opened |\n|---|---|---|---|\n${rows}`
        } catch {
          return '**Error:** Could not fetch investigations.'
        }
      }

      case '/activity': {
        try {
          const res = await fetch('/data/agent-activity.json')
          const data = await res.json() as Array<{
            id: string; at: string; type: string; severity: string; title: string; detail: string
          }>
          if (!data.length) return '**No recent activity.**'
          const recent = data.slice(0, 10)
          const severityIcon = (s: string) => ({ critical: '🔴', high: '🟠', warning: '🟡', info: '🔵' }[s] ?? '⚪')
          const rows = recent.map(e =>
            `| ${severityIcon(e.severity)} | ${e.type} | ${e.title} | ${(e.at ?? '').replace('T', ' ').substring(0, 16)} UTC |`
          ).join('\n')
          return `**Agent Activity** — last ${recent.length} events\n\n| | Type | Event | Time |\n|---|---|---|---|\n${rows}`
        } catch {
          return '**Error:** Could not fetch activity feed.'
        }
      }

      case '/alerts': {
        try {
          const [activityRes, healthRes] = await Promise.all([
            fetch('/data/agent-activity.json'),
            fetch('/data/system-health.json'),
          ])
          const activity = await activityRes.json() as Array<{
            id: string; at: string; type: string; severity: string; title: string; detail: string
          }>
          const health = await healthRes.json()

          // Filter high/critical activity
          const alerts = activity.filter(e => e.severity === 'critical' || e.severity === 'high')

          // KEV deadlines from system health if present
          const kevLines: string[] = []
          const kevItems = health.kevDeadlines ?? []
          for (const k of kevItems) {
            if (k.dueDate) {
              const due = new Date(k.dueDate)
              const daysLeft = Math.ceil((due.getTime() - Date.now()) / 86400000)
              if (daysLeft >= 0) {
                kevLines.push(`| ⏰ | KEV Deadline | ${k.cve ?? k.title} — due ${k.dueDate} (${daysLeft}d) | ${k.dueDate} |`)
              }
            }
          }

          if (!alerts.length && !kevLines.length) return '**No active alerts or KEV deadlines.**'

          const severityIcon = (s: string) => ({ critical: '🔴', high: '🟠' }[s] ?? '🔵')
          const alertRows = alerts.map(e =>
            `| ${severityIcon(e.severity)} | ${e.type} | ${e.title} | ${(e.at ?? '').replace('T', ' ').substring(0, 16)} UTC |`
          ).join('\n')
          const allRows = [...alertRows.split('\n'), ...kevLines].filter(Boolean).join('\n')
          return `**Active Alerts & KEV Deadlines** (${alerts.length} alert${alerts.length !== 1 ? 's' : ''}, ${kevLines.length} KEV)\n\n| | Type | Title | Time/Due |\n|---|---|---|---|\n${allRows}`
        } catch {
          return '**Error:** Could not fetch alerts.'
        }
      }

      case '/dream_cycle':
        // Signal to sendMessage to forward this to the gateway instead of returning static content
        return '__GATEWAY_PASSTHROUGH__'

      default:
        return `**Unknown command:** \`${base}\`\n\nType \`/help\` for available commands.`
    }
  }, [])

  const simulateDemoStream = useCallback(async (content: string) => {
    const userMsg: Message = {
      id: uuidv4(), role: 'user', content, timestamp: new Date().toISOString(),
    }
    const agentId = uuidv4()
    const agentMsg: Message = {
      id: agentId, role: 'agent', content: '', streaming: true,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg, agentMsg])
    setStreaming(true)

    const response = `**Demo Mode** — Live chat is not configured.\n\nTo enable: set \`VITE_OPENWEBUI_URL\` in \`.env.local\` to your MindStone gateway URL and restart the service.`
    for (const word of response.split(' ')) {
      await new Promise<void>(r => setTimeout(r, 25))
      setMessages(prev => prev.map(m =>
        m.id === agentId ? { ...m, content: m.content + (m.content ? ' ' : '') + word } : m
      ))
    }
    setMessages(prev => prev.map(m => m.id === agentId ? { ...m, streaming: false } : m))
    setStreaming(false)
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return
    setError(null)

    // Slash command intercept — resolved client-side, never forwarded to gateway
    if (content.trim().startsWith('/')) {
      const cmd = content.trim().toLowerCase()
      if (cmd === '/clear') {
        // Inline clear to avoid circular dep with clearMessages useCallback
        clearPersistedMessages(sessionIdRef.current)
        setMessages([])
        setError(null)
        const newKey = uuidv4()
        sessionIdRef.current = newKey
        if (!isDemoMode) persistSessionKey(newKey)
        return
      }
      const result = await handleSlashCommand(content.trim())
      if (result !== '__GATEWAY_PASSTHROUGH__') {
        const userMsg: Message = { id: uuidv4(), role: 'user', content, timestamp: new Date().toISOString() }
        const agentMsg: Message = { id: uuidv4(), role: 'agent', content: result, timestamp: new Date().toISOString() }
        setMessages(prev => [...prev, userMsg, agentMsg])
        return
      }
      // __GATEWAY_PASSTHROUGH__ — fall through to gateway with the slash command as the message
    }

    if (isDemoMode) {
      await simulateDemoStream(content)
      return
    }

    const userMsg: Message = {
      id: uuidv4(), role: 'user', content, timestamp: new Date().toISOString(),
    }
    const agentId = uuidv4()
    const agentMsg: Message = {
      id: agentId, role: 'agent', content: '', streaming: true,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg, agentMsg])
    setStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.modelId,
          messages: buildHistory(messages, content),
          stream: true,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') {
            setMessages(prev => prev.map(m =>
              m.id === agentId ? { ...m, streaming: false } : m
            ))
            clearDraft()
            return
          }
          try {
            const parsed = JSON.parse(data) as {
              choices?: Array<{ delta?: { content?: string } }>
            }
            const token = parsed.choices?.[0]?.delta?.content ?? ''
            if (token) {
              accumulated += token
              setMessages(prev => prev.map(m =>
                m.id === agentId ? { ...m, content: m.content + token } : m
              ))
              // Persist in-progress content so a refresh can recover it
              saveDraft(sessionIdRef.current, agentId, accumulated)
              // Fire TTS callback if registered
              tokenCallbackRef.current?.(token)
            }
          } catch { /* skip malformed SSE lines */ }
        }
      }
    } catch (err) {
      clearDraft()
      if (err instanceof Error && err.name === 'AbortError') {
        setMessages(prev => prev.map(m =>
          m.id === agentId
            ? { ...m, content: m.content + ' [interrupted]', streaming: false, interrupted: true }
            : m
        ))
      } else {
        setMessages(prev => prev.map(m =>
          m.id === agentId
            ? { ...m, content: m.content || 'Response timed out — retry?', streaming: false, interrupted: true }
            : m
        ))
        setError(err instanceof Error ? err.message : 'Connection error')
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
      streamEndCallbackRef.current?.()
    }
  }, [isDemoMode, simulateDemoStream, settings, messages, buildHistory])

  const cancelStream = useCallback(() => { abortRef.current?.abort() }, [])

  const clearMessages = useCallback(() => {
    clearPersistedMessages(sessionIdRef.current)
    setMessages([])
    setError(null)
    const newKey = uuidv4()
    sessionIdRef.current = newKey
    if (!isDemoMode) {
      persistSessionKey(newKey)
    }
  }, [isDemoMode])

  const loadSession = useCallback(async (sessionId: string) => {
    if (isDemoMode) {
      const msgs = DEMO_SESSION_MESSAGES[sessionId]
      if (msgs) {
        setMessages(msgs)
        setActiveSessionId(sessionId)
        sessionIdRef.current = sessionId
      }
      return
    }
    // Session loading not supported in REST mode — no-op
    setActiveSessionId(sessionId)
    sessionIdRef.current = sessionId
  }, [isDemoMode])

  return {
    messages, streaming, error, isDemoMode,
    sessions, sessionsLoading, activeSessionId,
    sendMessage, cancelStream, clearMessages, loadSession,
    setTokenCallback, setStreamEndCallback,
  }
}
