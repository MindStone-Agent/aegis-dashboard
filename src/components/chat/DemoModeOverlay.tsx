import { AlertCircle, Settings } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'

export function DemoModeOverlay() {
  const setSettingsPanelOpen = useUIStore(s => s.setSettingsPanelOpen)

  return (
    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-aegis-bg-panel via-aegis-bg-panel/95 to-transparent flex flex-col items-center justify-end pb-4 px-4 z-10">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle size={12} className="text-amber-500" />
        <span className="text-xs font-mono font-semibold text-amber-400 tracking-widest">DEMO MODE</span>
      </div>
      <p className="text-xs font-mono text-aegis-text-muted text-center mb-3 leading-relaxed">
        Live chat requires Open WebUI connection
      </p>
      <button
        onClick={() => setSettingsPanelOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-semibold transition-colors"
      >
        <Settings size={11} />
        Configure Open WebUI
      </button>
    </div>
  )
}
