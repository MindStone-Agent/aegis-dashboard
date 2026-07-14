# AEGIS — OT/ICS Threat Intelligence Dashboard

A dark-mode tactical interface for surfacing actionable OT/ICS threat intelligence alongside a live AI analyst chat pane. Built as Phase 1 of the MindStone platform.

**Version:** 1.0 — Phase 1 Frontend Prototype (delivered 2026-03-18)
**Status:** Production-ready frontend; Phase 2 (backend proxy + WebSocket) planned.

---

## What It Does

Aegis Dashboard is a single-page application that reads five structured JSON files produced by the MindStone Threat Analyst AI Agent and renders them across six purpose-designed operational panels. The aesthetic and information density are drawn from professional SIEM/SOC tooling: Dragos Platform, dark-mode Splunk, Elastic Security. A right-side chat pane connects to the Open WebUI API (via SSE token streaming) and degrades gracefully to demo mode when no API is configured.

The dashboard is read-only. No data is written back to the JSON files.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 18.3 |
| Build tool | Vite | 6.x |
| Language | TypeScript | 5.7 strict |
| UI state | Zustand | 5.x |
| Server state / polling | TanStack Query | 5.x |
| Styling | Tailwind CSS | 3.x |
| Schema validation | Zod | 3.x |
| Markdown rendering | react-markdown + rehype-highlight | 9.x / 7.x |
| Icons | lucide-react | 0.469 |
| Date formatting | date-fns | 4.x |
| ID generation | uuid | 11.x |

No external component library. All panel components are custom-built against the Aegis design token system.

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A modern browser (Chrome or Edge recommended; Safari not supported in Phase 1)

### Install and Run

```bash
# From the project root
npm install

# Start development server (http://localhost:5173)
npm run dev
```

The dashboard opens immediately in demo mode — no configuration required. All five panels render with realistic OT/ICS mock data from `public/data/`.

### Build for Production

```bash
npm run build
```

Output goes to `dist/`. Serve with any static file server or `npm run preview` for a local preview of the production bundle.

---

## Configuration

Copy the example environment file and edit as needed:

```bash
cp .env.example .env.local
```

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_OPENWEBUI_URL` | _(empty)_ | Base URL of your Open WebUI / MindStone instance (e.g., `http://localhost:3000`). **Leave empty to run in demo mode.** |
| `VITE_OPENWEBUI_API_KEY` | _(empty)_ | Bearer token for the Open WebUI API. Only used in development; the Vite proxy injects it so the key never reaches the browser in production. |
| `VITE_MODEL_ID` | `threat-analyst` | Model ID to pass in chat completion requests. |

Environment variables set here are development-only defaults. At runtime, all three values are also configurable via the in-app Settings panel (persisted to `localStorage` under the key `aegis-ui-store`).

---

## Project Structure

```
aegis-dashboard/
├── public/
│   └── data/                   # Mock JSON data files (served as static assets)
│       ├── intel-feed.json
│       ├── threat-groups.json
│       ├── investigations.json
│       ├── daily-summary.json
│       └── system-health.json
├── src/
│   ├── App.tsx                 # TanStack Query provider + AppShell root
│   ├── main.tsx                # React DOM entry point
│   ├── index.css               # Global styles (scanline texture, animations)
│   ├── schemas/                # Zod schemas — single source of truth for all types
│   │   ├── intel-feed.ts
│   │   ├── threat-groups.ts
│   │   ├── investigations.ts
│   │   ├── daily-summary.ts
│   │   └── system-health.ts
│   ├── hooks/                  # Custom React hooks
│   │   ├── useIntelFeed.ts
│   │   ├── useThreatGroups.ts
│   │   ├── useInvestigations.ts
│   │   ├── useDailySummary.ts
│   │   ├── useSystemHealth.ts
│   │   └── useStreamingChat.ts
│   ├── store/
│   │   └── uiStore.ts          # Zustand store (chatOpen, settingsPanelOpen, settings)
│   ├── lib/
│   │   ├── sort.ts             # Sorting and deduplication utilities
│   │   ├── staleness.ts        # Staleness badge computation
│   │   └── demoConversation.ts # Pre-loaded demo chat messages
│   └── components/
│       ├── layout/
│       │   ├── AppShell.tsx    # Root layout; keyboard shortcuts; offline detection
│       │   ├── TopNav.tsx      # 48px header; last-updated timestamp; refresh/settings
│       │   ├── MainCanvas.tsx  # Left intel column + right chat pane split
│       │   └── FooterBar.tsx   # 40px fixed footer; system health widget
│       ├── panels/
│       │   ├── IntelFeedPanel.tsx + IntelFeedItem.tsx
│       │   ├── ThreatGroupPanel.tsx + ThreatGroupCard.tsx
│       │   ├── InvestigationsPanel.tsx + InvestigationCard.tsx
│       │   └── DailySummaryPanel.tsx
│       ├── chat/
│       │   ├── ChatPane.tsx
│       │   ├── MessageThread.tsx
│       │   ├── MessageInput.tsx
│       │   ├── AgentMessage.tsx
│       │   ├── UserMessage.tsx
│       │   └── DemoModeOverlay.tsx
│       └── shared/
│           ├── PriorityBadge.tsx
│           ├── StatusBadge.tsx
│           ├── ConfidenceBadge.tsx
│           ├── StalenessBadge.tsx
│           ├── SourceChip.tsx
│           ├── CveTag.tsx
│           ├── SkeletonPanel.tsx
│           ├── ErrorBoundary.tsx
│           ├── OfflineBanner.tsx
│           └── SettingsPanel.tsx
├── .env.example
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## The Six Panels

### 1. Threat Intel Feed (`IntelFeedPanel`)

Renders entries from `intel-feed.json`, sorted HIGH → MEDIUM → LOW priority. Each entry is expandable to show the full OT relevance assessment and analyst note. CVE tags link directly to the NVD entry. Items that appear in a new poll cycle flash with a brief highlight animation.

**Data shape highlights:** `id`, `priority` (HIGH/MEDIUM/LOW), `title`, `source`, `url`, `publishedAt`, `vendors[]`, `cves[]`, `otRelevance`, `analystNote`, `updatedAt`.

### 2. Threat Group Tracker (`ThreatGroupPanel`)

Card grid of tracked threat groups. Two columns on large viewports, single column below. Each card shows nexus, status (ACTIVE/SILENT/PREPOSITIONING), target sectors, ICS ATT&CK TTPs (with "+N more" toggle), confidence rating, and optional analyst notes.

**Data shape highlights:** `name`, `nexus`, `status`, `lastActivityDate`, `targetSectors[]`, `ttps[]`, `confidence` (HIGH/MEDIUM/LOW), `notes`.

### 3. Active Investigations (`InvestigationsPanel`)

Displays only ACTIVE investigations from `investigations.json`. Each card includes a 9-step MITRE ATT&CK for ICS stage tracker (INITIAL_ACCESS through IMPACT), a fill/current/future visual progress bar, hypotheses with confidence ratings, and a list of recommended next actions.

**Data shape highlights:** `id`, `scenarioName`, `sector`, `stage` (one of 9 ATT&CK ICS stages), `hypotheses[]` (hypothesis + confidence + notes), `nextActions[]`, `analystNotes`, `status` (ACTIVE/CLOSED).

### 4. Daily Intel Summary (`DailySummaryPanel`)

Shows the AI agent's daily summary report. Previous/Next navigation through the history in `daily-summary.json` (sorted newest first, purely in-memory — no network re-fetch on navigation). Displays the sources checked, top 3 findings ranked by relevance, and any alerts triggered that day.

**Data shape highlights:** `date` (YYYY-MM-DD), `sourcesChecked[]`, `sourceCount`, `topFindings[]` (rank 1–3, description, source), `alertsTriggered[]` (title, severity, triggeredAt).

### 5. System Health Widget (`SystemHealthWidget`)

Fixed in the 40px footer. Shows the MindStone platform's operational status at a glance: last dream cycle run, vector store document count, Brave Search quota remaining (turns red at zero), and API status dots for Anthropic and OpenAI. Hovering or focusing any status dot shows a tooltip with last-checked timestamp and error message if present. Tooltips are keyboard-accessible via Tab focus.

**Data shape highlights:** `lastDreamCycle` (runAt, chunksStored, status), `vectorStore` (totalDocuments, lastUpdated), `braveSearch` (estimatedQueriesRemaining, dailyQuota, queriesUsedToday), `apis.anthropic`, `apis.openai`, `updatedAt`.

### 6. Live Chat Pane (`ChatPane`)

Collapsible right-column chat interface. Width is `w-80` (320px) at large breakpoints and `w-96` (384px) at xl. Hidden on mobile (below `md` breakpoint). Connects to the Open WebUI API via SSE streaming using `fetch()` + `ReadableStream` — EventSource is not used because it does not support POST requests. When collapsed, the pane displays a right-pointing chevron (indicating expand direction), an enlarged "ANALYST CHAT" label, and a pulsing activity indicator dot when the session contains messages.

A session selector dropdown at the top of the pane lists recent sessions. In demo mode, three pre-loaded sessions with full message history are available. In live mode, sessions are fetched from `GET /api/v1/chats/`.

---

## Mock Data

All five JSON files live in `public/data/` and are served as Vite static assets. They contain realistic OT/ICS domain intelligence relative to a reference date of 2026-03-18:

| File | Contents |
|------|----------|
| `intel-feed.json` | 11 advisories from CISA, Dragos, CloudSEK, Claroty, and others. Multiple HIGH-priority items including CVE-2024-43647 (Siemens S7-1500). |
| `threat-groups.json` | 6 tracked groups: VOLTZITE, ELECTRUM, KAMACITE, AZURITE, PYROXENE, SYLVANITE — drawn from public Dragos threat group naming conventions. |
| `investigations.json` | 4 investigations: 2 ACTIVE (one early-stage, one late-stage), 1 CLOSED, 1 additional for variety. |
| `daily-summary.json` | 7 consecutive daily summaries ending on 2026-03-18. |
| `system-health.json` | Single-object file reflecting MindStone platform status. |

To use the dashboard with real agent output, replace these files with the JSON produced by the MindStone Threat Analyst AI Agent. The files must continue to validate against the Zod schemas in `src/schemas/`.

The poll interval defaults to 30 seconds and is configurable in the Settings panel (range: 10–300 seconds).

---

## Open WebUI Chat Integration

### Demo Mode (default)

Demo mode activates automatically when `VITE_OPENWEBUI_URL` is not set, or when the Open WebUI URL field in the Settings panel is empty. In demo mode:

- A pre-loaded conversation between the analyst and the AI agent is displayed (`src/lib/demoConversation.ts`)
- Three demo sessions are available in the session dropdown (VOLTZITE analysis, GRAPHITE IOCs, advisory review)
- Sending a message triggers a simulated word-by-word stream response explaining how to connect a live endpoint
- No network calls are made to any API

### Connecting to a Live Open WebUI Instance

1. Click **SETTINGS** in the top navigation bar (or press `S` from anywhere outside an input)
2. Enter your Open WebUI URL (e.g., `http://localhost:3000`)
3. Enter your API key
4. Optionally change the Model ID (default: `threat-analyst`)
5. Click **SAVE SETTINGS**

The Vite development server proxies all `/api` requests to the configured Open WebUI URL, injecting the Authorization header server-side so the API key is not exposed in browser network requests.

Settings are persisted to `localStorage` (key: `aegis-ui-store`) and survive page reloads.

### SSE Streaming Protocol

The chat hook (`useStreamingChat`) sends `POST /api/chat/completions` with `"stream": true`. It reads the response body as a `ReadableStream`, parses `data:` lines, and appends delta tokens to the agent message state as they arrive. On receiving `data: [DONE]`, it fires a `POST /api/chat/completed` to persist the session (fire-and-forget with one silent retry). On stream error or user cancellation, the message is marked `[stream interrupted]` and the completed call is skipped.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `R` | Refresh all data (invalidates all TanStack Query caches) |
| `C` | Toggle chat pane open/closed |
| `Ctrl+Enter` | Send chat message (when input is focused) |
| `Escape` | Close Settings panel |

Shortcuts `R` and `C` are disabled when focus is inside an `INPUT` or `TEXTAREA` element.

---

## Accessibility

The dashboard targets WCAG 2.1 AA compliance. The following features were implemented as part of a post-prototype UX review (2026-03-18):

- **Non-color badge encoding**: All four badge components (`PriorityBadge`, `StatusBadge`, `ConfidenceBadge`, `StalenessBadge`) include icon and shape redundancy alongside color. No status signal relies on color alone. This ensures colorblind analysts (e.g., deuteranopia affects ~8% of males) can correctly read HIGH/MEDIUM/LOW, ACTIVE/SILENT/PREPOSITIONING, and staleness state.
- **Settings panel focus trap**: The Settings panel (`SettingsPanel`) implements a full keyboard focus trap conforming to the ARIA Modal Dialog pattern (WCAG 2.1 SC 2.1.2). On open, focus moves to the first focusable element inside the dialog; on close, focus returns to the triggering Settings button in TopNav.
- **Text contrast — `aegis-text-muted`**: The muted text color was raised from `#4b5563` (~3.1:1) to `#6b7280` (~4.6:1 against `#0d1117`), meeting WCAG AA 4.5:1 for normal text. This token propagates through timestamps, metadata rows, TTP bullets, session labels, and system health metrics.
- **TopNav alert badge**: A pulsing red badge appears on the shield icon in TopNav when new HIGH-priority intel items arrive in a poll cycle. The badge count reflects unread HIGH items since the analyst last visited the Intel Feed panel. Implemented via `uiStore` unread tracking.
- **Chat pane collapsed state**: The collapsed chat pane chevron direction was corrected (now points right, toward the direction of expansion). The "ANALYST CHAT" vertical label font size was increased for legibility. A pulsing activity indicator dot appears when the current session has messages, giving analysts a reason to open the pane without requiring them to already know it exists.
- **System Health tooltips — keyboard access**: The `Tooltip` wrappers in `SystemHealthWidget` are now focusable (`tabIndex={0}`) with `onFocus`/`onBlur` handlers mirroring the existing `onMouseEnter`/`onMouseLeave` behavior. Tooltip content (last-checked timestamps, quota values, error messages) is accessible to keyboard-only and screen reader users.

---

## Resilience and Edge Cases

- **Panel-level error boundaries**: each panel wraps its content in an `ErrorBoundary`. A Zod parse failure or network error in one panel does not affect the others.
- **Loading skeletons**: structural shimmer skeletons (not spinners) appear while data is fetching.
- **Offline banner**: an `OfflineBanner` component renders above the TopNav when `navigator.onLine` is false, with a timestamp of when the connection was last seen.
- **Staleness badges**: computed at render time using `Date.now()` against the `updatedAt` field in each JSON entry — no stored staleness state.
- **Reduced motion**: all animations respect `prefers-reduced-motion` via Tailwind's `motion-safe:` variant.

---

## Data File Schema Reference

All TypeScript types are inferred from Zod schemas — never manually duplicated. The schemas live in `src/schemas/` and are the authoritative source of truth for what the JSON files must contain.

```
IntelFeed        = z.array(IntelFeedEntrySchema)
ThreatGroups     = z.array(ThreatGroupEntrySchema)
Investigations   = z.array(InvestigationEntrySchema)
DailySummary     = z.array(DailySummaryEntrySchema)
SystemHealth     = SystemHealthSchema   (single object, not array)
```

A parse failure (invalid JSON or schema mismatch) triggers the panel-level error boundary, which renders an inline error state without crashing the rest of the dashboard.

---

## Phase 2 Roadmap

The following are explicitly out of scope for Phase 1 and planned for Phase 2:

- Node.js/Express backend proxy (removes the need for Vite's dev proxy; secures API keys in production)
- REST push endpoints to replace file polling
- WebSocket real-time updates (Phase 3)
- Docker Compose deployment configuration
- Authentication / login screen
- Vitest unit tests, React Testing Library component tests, and Playwright E2E tests (deferred from Phase 1)

---

## Related Documentation

| Document | Path |
|----------|------|
| Plugin / install guide | `PLUGIN.md` |
| Data contract (Zod schemas) | `src/schemas/` |
| Companion persona pack | `mindstone/cti-analyst-lite` |
