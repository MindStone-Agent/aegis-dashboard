import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Eye, EyeOff, Save } from 'lucide-react'
import { useUIStore, type Settings } from '../../store/uiStore'

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function SettingsPanel() {
  const { settingsPanelOpen, settings, setSettingsPanelOpen, saveSettings } = useUIStore()
  const [form, setForm] = useState<Settings>(settings)
  const [showApiKey, setShowApiKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  // Holds the element that triggered the settings open, so focus returns on close
  const triggerRef = useRef<Element | null>(null)

  useEffect(() => {
    if (settingsPanelOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: resetting local form state when panel opens is a valid derived-state sync pattern
      setForm(settings)
      setSaved(false)
      // Capture the element that triggered the open and move focus into dialog
      triggerRef.current = document.activeElement
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTORS)
      firstFocusable?.focus()
    } else {
      // Return focus to the triggering element when panel closes
      if (triggerRef.current && triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus()
        triggerRef.current = null
      }
    }
  }, [settingsPanelOpen, settings])

  // Focus trap: intercept Tab / Shift+Tab to keep focus within dialog
  const handleFocusTrap = useCallback((e: KeyboardEvent) => {
    if (!settingsPanelOpen || e.key !== 'Tab') return
    const panel = panelRef.current
    if (!panel) return
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS))
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [settingsPanelOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && settingsPanelOpen) {
        setSettingsPanelOpen(false)
      }
      handleFocusTrap(e)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [settingsPanelOpen, setSettingsPanelOpen, handleFocusTrap])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setSettingsPanelOpen(false)
      }
    }
    if (settingsPanelOpen) {
      setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [settingsPanelOpen, setSettingsPanelOpen])

  const handleSave = () => {
    const pollInterval = Math.max(10, Math.min(300, form.pollIntervalSeconds))
    saveSettings({ ...form, pollIntervalSeconds: pollInterval })
    setSaved(true)
    setTimeout(() => setSettingsPanelOpen(false), 800)
  }

  const handleCancel = () => {
    setForm(settings)
    setSettingsPanelOpen(false)
  }

  return (
    <>
      {settingsPanelOpen && (
        <div className="fixed inset-0 bg-black/40 z-40" aria-hidden="true" />
      )}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Settings Panel"
        aria-modal="true"
        className={`fixed top-0 right-0 h-full w-80 bg-aegis-bg-overlay border-l border-aegis-border-panel z-50 flex flex-col
          transition-transform duration-300 ease-in-out
          ${settingsPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-aegis-border-panel">
          <span className="text-xs font-mono font-semibold text-aegis-text-primary tracking-widest">
            SETTINGS
          </span>
          <button
            onClick={handleCancel}
            className="p-1 text-aegis-text-secondary hover:text-aegis-text-primary"
            aria-label="Close settings"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <h3 className="text-xs font-mono font-semibold text-aegis-text-secondary tracking-widest mb-3 uppercase">
              Open WebUI Connection
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-aegis-text-secondary mb-1">
                  Open WebUI URL
                </label>
                <input
                  type="url"
                  value={form.openWebuiUrl}
                  onChange={e => setForm(f => ({ ...f, openWebuiUrl: e.target.value }))}
                  placeholder="http://localhost:3000"
                  className="w-full bg-aegis-bg-input border border-aegis-border-panel px-3 py-2 text-xs font-mono text-aegis-text-primary placeholder-aegis-text-muted focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-aegis-text-secondary mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={form.apiKey}
                    onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
                    placeholder="sk-..."
                    className="w-full bg-aegis-bg-input border border-aegis-border-panel px-3 py-2 pr-9 text-xs font-mono text-aegis-text-primary placeholder-aegis-text-muted focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-aegis-text-muted hover:text-aegis-text-secondary"
                    aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                  >
                    {showApiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-aegis-text-secondary mb-1">
                  Model ID
                </label>
                <input
                  type="text"
                  value={form.modelId}
                  onChange={e => setForm(f => ({ ...f, modelId: e.target.value }))}
                  placeholder="threat-analyst"
                  className="w-full bg-aegis-bg-input border border-aegis-border-panel px-3 py-2 text-xs font-mono text-aegis-text-primary placeholder-aegis-text-muted focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-mono font-semibold text-aegis-text-secondary tracking-widest mb-3 uppercase">
              Data Polling
            </h3>
            <div>
              <label className="block text-xs font-mono text-aegis-text-secondary mb-1">
                Poll Interval (seconds)
              </label>
              <input
                type="number"
                min={10}
                max={300}
                value={form.pollIntervalSeconds}
                onChange={e => setForm(f => ({ ...f, pollIntervalSeconds: parseInt(e.target.value) || 30 }))}
                className="w-full bg-aegis-bg-input border border-aegis-border-panel px-3 py-2 text-xs font-mono text-aegis-text-primary focus:outline-none focus:border-amber-500"
              />
              <p className="text-xs text-aegis-text-muted font-mono mt-1">Range: 10–300 seconds (default: 30)</p>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-mono font-semibold text-aegis-text-secondary tracking-widest mb-3 uppercase">
              Keyboard Shortcuts
            </h3>
            <div className="space-y-1.5 text-xs font-mono text-aegis-text-secondary">
              <div className="flex justify-between">
                <span>Ctrl+Enter</span>
                <span className="text-aegis-text-muted">Send chat message</span>
              </div>
              <div className="flex justify-between">
                <span>Escape</span>
                <span className="text-aegis-text-muted">Close settings / modal</span>
              </div>
              <div className="flex justify-between">
                <span>R</span>
                <span className="text-aegis-text-muted">Refresh all data</span>
              </div>
              <div className="flex justify-between">
                <span>C</span>
                <span className="text-aegis-text-muted">Toggle chat pane</span>
              </div>
            </div>
          </section>
        </div>

        <div className="px-4 py-3 border-t border-aegis-border-panel flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-semibold py-2 transition-colors"
          >
            <Save size={12} />
            {saved ? 'SAVED' : 'SAVE SETTINGS'}
          </button>
          <button
            onClick={handleCancel}
            className="px-4 text-xs font-mono text-aegis-text-secondary border border-aegis-border-panel hover:border-aegis-border-strong hover:text-aegis-text-primary py-2 transition-colors"
          >
            CANCEL
          </button>
        </div>
      </div>
    </>
  )
}
