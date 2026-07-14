import { SystemHealthWidget } from '../panels/SystemHealthWidget'

export function FooterBar() {
  return (
    <footer className="h-footer flex-shrink-0 border-t border-aegis-border-panel bg-aegis-bg-panel z-50">
      <SystemHealthWidget />
    </footer>
  )
}
