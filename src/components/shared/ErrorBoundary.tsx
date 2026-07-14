import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-aegis-bg-panel border border-red-500/30 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle size={14} />
            <span className="text-xs font-mono font-semibold">
              {this.props.fallbackTitle ?? 'DATA UNAVAILABLE'}
            </span>
          </div>
          <p className="text-xs text-aegis-text-secondary font-mono">
            Data unavailable — malformed intel file
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1.5 text-xs font-mono text-amber-400 hover:text-amber-300 w-fit"
          >
            <RefreshCw size={11} />
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
