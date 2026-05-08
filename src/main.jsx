import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import * as Sentry from '@sentry/react'
import ErrorBoundary from './components/ErrorBoundary'
import App from './App'
import './index.css'

// Clerk — publishable key from env
const CLERK_PK = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!CLERK_PK) {
  console.warn('VITE_CLERK_PUBLISHABLE_KEY not set — auth features disabled')
}

// Sentry — only initialises when VITE_SENTRY_DSN is set in .env
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,          // 'development' | 'production'
    release: import.meta.env.VITE_APP_VERSION,  // optional — set in CI
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.2 : 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
  })
}

function AppWithProviders() {
  if (!CLERK_PK) {
    // No Clerk configured — run without auth (dev/demo mode)
    return (
      <ErrorBoundary>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    )
  }

  return (
    <ClerkProvider publishableKey={CLERK_PK} afterSignOutUrl="/">
      <ErrorBoundary>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </ClerkProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppWithProviders />
  </React.StrictMode>
)
