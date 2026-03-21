import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import * as Sentry from '@sentry/react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, eventId: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)

    // Chunk load errors happen when a lazy-loaded JS bundle fails to download
    // (network blip, CDN hiccup). Auto-reload once to re-fetch from cache/CDN.
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed')

    if (isChunkError && !sessionStorage.getItem('chunk-reload-attempted')) {
      sessionStorage.setItem('chunk-reload-attempted', '1')
      window.location.reload()
      return
    }
    // Clear the flag so future genuine errors still show the UI
    sessionStorage.removeItem('chunk-reload-attempted')

    // Report to Sentry if configured
    if (import.meta.env.VITE_SENTRY_DSN) {
      const eventId = Sentry.captureException(error, { extra: errorInfo })
      this.setState({ eventId })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
          <div className="glass rounded-2xl p-10 text-center max-w-md border border-red-500/20">
            <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-400 mb-6">
              An unexpected error occurred. Please reload the page to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="glow-btn rounded-xl px-6 py-3 text-sm font-medium text-white inline-flex items-center gap-2"
            >
              <RefreshCw size={16} /> Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
