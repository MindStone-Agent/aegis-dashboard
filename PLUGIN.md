# Aegis Dashboard — MindStone Companion Plugin

A dark-mode tactical OT/ICS threat intelligence dashboard that reads structured JSON
produced by the **CTI Analyst persona pack** and renders it across six operational panels.

**Designed as a companion plugin** to the `mindstone/cti-analyst-lite` persona pack.
The persona emits data via its `dashboard-output` skill; this dashboard consumes it.

---

## Architecture

```
CTI Analyst Persona (MindStone agent)
   │  dashboard-output skill
   │  writes JSON to shared data directory
   ▼
public/data/
   ├── intel-feed.json
   ├── threat-groups.json
   ├── investigations.json
   ├── daily-summary.json
   ├── system-health.json
   ├── agent-activity.json
   └── focus-mode.json
   │
   ▼
Aegis Dashboard (Vite + React)
   │  TanStack Query polls every 30s
   │  Zod validates on read
   ▼
Browser
```

The dashboard is **read-only** — it never writes to the data files. The persona pack
is the sole producer. This separation means the dashboard can be served as a static
site with no backend.

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- The CTI Analyst persona pack installed and running on a MindStone agent

### Install

```bash
git clone https://github.com/MindStone-Agent/aegis-dashboard.git
cd aegis-dashboard
npm install
```

### Configure the data directory

The dashboard reads JSON from `public/data/`. Point this at the directory where
the CTI persona pack writes its output:

```bash
# Option A: Symlink to the agent's workspace data directory
ln -sf /path/to/agent/workspace/dashboard public/data

# Option B: Copy the sample data and replace with live output
cp public/data/*.json /path/to/agent/workspace/dashboard/
```

### Run

```bash
npm run dev
```

Opens at `http://localhost:5173`. The dashboard renders immediately — if no data
files exist, panels show empty states.

### Build for production

```bash
npm run build
# Serves from dist/ — deploy with any static file server
```

---

## Data Contract

The dashboard validates all incoming JSON against Zod schemas in `src/schemas/`.
These schemas are the **shared contract** between the dashboard and the persona pack's
`dashboard-output` skill. See `src/schemas/` for the authoritative type definitions.

| File | Schema | Description |
|------|--------|-------------|
| `intel-feed.json` | `IntelFeedSchema` | Advisory and event entries |
| `threat-groups.json` | `ThreatGroupsSchema` | Threat actor cards |
| `investigations.json` | `InvestigationsSchema` | Active investigations |
| `daily-summary.json` | `DailySummarySchema` | Daily intel pull summaries |
| `system-health.json` | `SystemHealthSchema` | Platform operational status |
| `agent-activity.json` | `AgentActivitySchema` | Agent activity feed |

A validation script is included:

```bash
node scripts/validate-dashboard.cjs
```

---

## Chat Pane (Optional)

The right-side chat pane connects to a MindStone gateway for live AI analyst chat.
Configure via `.env.local`:

```env
VITE_OPENWEBUI_URL=http://localhost:18789
VITE_OPENWEBUI_API_KEY=your-api-key
```

Leave unset to run in demo mode with pre-loaded conversations.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 6 |
| State | Zustand + TanStack Query |
| Styling | Tailwind CSS 3 |
| Validation | Zod 3 |
| Icons | lucide-react |

---

## Panels

1. **Threat Intel Feed** — advisories sorted by priority, expandable detail
2. **Threat Group Tracker** — actor cards with nexus, status, TTPs, confidence
3. **Active Investigations** — MITRE ATT&CK stage tracker, hypotheses, next actions
4. **Daily Intel Summary** — per-pull summaries with top findings and alerts
5. **System Health** — footer widget: dream cycle, vector store, API status
6. **Live Chat** — collapsible AI analyst chat (MindStone gateway)

---

## Companion Pack

This dashboard is designed to pair with the **CTI Analyst (Lite)** persona pack
(`mindstone/cti-analyst-lite`). The pack's `dashboard-output` skill emits data
in the exact schema this dashboard consumes. Install both together for a complete
CTI operations surface.
