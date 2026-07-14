import { useEffect, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '../../store/uiStore'
import { TopNav } from './TopNav'
import { MainCanvas } from './MainCanvas'
import { FooterBar } from './FooterBar'
import { SettingsPanel } from '../shared/SettingsPanel'
import { OfflineBanner } from '../shared/OfflineBanner'
import { SETTINGS_ENABLED } from '../../lib/feature-flags'

export function AppShell() {
  const queryClient = useQueryClient()
  const { chatOpen, settingsPanelOpen, setChatOpen, setSettingsPanelOpen } = useUIStore()
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [cachedAt, setCachedAt] = useState<Date | null>(navigator.onLine ? null : new Date())

  const handleOnline = useCallback(() => {
    setIsOffline(false)
  }, [])

  const handleOffline = useCallback(() => {
    setIsOffline(true)
    setCachedAt(new Date())
  }, [])

  useEffect(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

      if (SETTINGS_ENABLED && e.key === 'Escape' && settingsPanelOpen) {
        setSettingsPanelOpen(false)
        return
      }

      // Global hotkeys: only when focus is not in an input AND no modifier keys are held.
      // This prevents collisions with common shortcuts like Ctrl+C (copy) and Cmd+C.
      const hasModifier = e.ctrlKey || e.metaKey || e.altKey

      if (!isInInput && !hasModifier) {
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault()
          queryClient.invalidateQueries()
        }
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault()
          setChatOpen(!chatOpen)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [queryClient, chatOpen, settingsPanelOpen, setChatOpen, setSettingsPanelOpen])

  return (
    <div className="flex flex-col h-screen bg-aegis-bg-base text-aegis-text-primary overflow-hidden">
      {isOffline && <OfflineBanner cachedAt={cachedAt} />}
      <TopNav />
      <MainCanvas />
      <FooterBar />
      {SETTINGS_ENABLED && <SettingsPanel />}
    </div>
  )
}
