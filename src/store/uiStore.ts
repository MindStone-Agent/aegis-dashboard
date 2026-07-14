import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SETTINGS_ENABLED } from '../lib/feature-flags'
import type { FocusMode } from '../utils/focusFilter'

export interface Settings {
  gatewayUrl: string
  openWebuiUrl: string
  apiKey: string
  modelId: string
  pollIntervalSeconds: number
}

const CHAT_WIDTH_DEFAULT = 384
const CHAT_WIDTH_MIN = 280
const CHAT_WIDTH_MAX = 600

export { CHAT_WIDTH_DEFAULT, CHAT_WIDTH_MIN, CHAT_WIDTH_MAX }

interface UIStore {
  chatOpen: boolean
  chatWidth: number
  settingsPanelOpen: boolean
  settings: Settings
  // Tracks count of unread HIGH-priority intel items that arrived since the analyst last
  // viewed the Intel Feed panel. Resets to 0 when the analyst focuses the feed.
  unreadHighCount: number
  // Three-state focus mode toggle: OT_ONLY | CONVERGED | BROAD
  // Controls which domain-tagged items are shown in filterable panels.
  focusMode: FocusMode
  setChatOpen: (open: boolean) => void
  setChatWidth: (width: number) => void
  setSettingsPanelOpen: (open: boolean) => void
  saveSettings: (settings: Settings) => void
  addUnreadHighItems: (count: number) => void
  clearUnreadHighItems: () => void
  setFocusMode: (mode: FocusMode) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      chatOpen: true,
      chatWidth: CHAT_WIDTH_DEFAULT,
      settingsPanelOpen: false,
      unreadHighCount: 0,
      focusMode: 'CONVERGED',
      settings: {
        // When SETTINGS_ENABLED=false, these are baked in at build time via .env.local
        // and the Settings panel is hidden — values here are the authoritative source.
        // When SETTINGS_ENABLED=true, localStorage persisted values override these defaults.
        gatewayUrl: import.meta.env.VITE_GATEWAY_URL ?? '',
        openWebuiUrl: import.meta.env.VITE_OPENWEBUI_URL ?? '',
        apiKey: import.meta.env.VITE_OPENWEBUI_API_KEY ?? '',
        modelId: import.meta.env.VITE_MODEL_ID ?? 'threat-analyst',
        pollIntervalSeconds: 30,
      },
      setChatOpen: (open) => set({ chatOpen: open }),
      setChatWidth: (width) => set({ chatWidth: Math.min(CHAT_WIDTH_MAX, Math.max(CHAT_WIDTH_MIN, width)) }),
      setSettingsPanelOpen: (open) => set({ settingsPanelOpen: open }),
      saveSettings: (settings) => set({ settings }),
      addUnreadHighItems: (count) => set(s => ({ unreadHighCount: s.unreadHighCount + count })),
      clearUnreadHighItems: () => set({ unreadHighCount: 0 }),
      setFocusMode: (mode) => set({ focusMode: mode }),
    }),
    {
      name: 'aegis-ui-store',
      // Do not persist unread count — it resets fresh on every page load.
      // Settings are only persisted when SETTINGS_ENABLED=true (user can change them
      // via the UI). When false, settings are baked in via env vars and should always
      // reflect .env.local — no stale localStorage values.
      partialize: (state) => ({
        chatOpen: state.chatOpen,
        chatWidth: state.chatWidth,
        focusMode: state.focusMode,
        ...(SETTINGS_ENABLED ? { settings: state.settings } : {}),
      }),
      // When SETTINGS_ENABLED=false, ignore any persisted settings in localStorage
      // so stale values never override env var defaults.
      merge: (persisted, current) => {
        const p = persisted as Partial<UIStore>
        if (!SETTINGS_ENABLED) {
          return { ...current, chatOpen: p?.chatOpen ?? current.chatOpen, chatWidth: p?.chatWidth ?? current.chatWidth }
        }
        return { ...current, ...p }
      },
    }
  )
)
