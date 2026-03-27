import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider } from './contexts/AuthContext'
import AuthGuard from './components/AuthGuard'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Settings = lazy(() => import('./pages/Settings'))
const Pricing = lazy(() => import('./pages/Pricing'))
const Dashboards = lazy(() => import('./pages/Dashboards'))
const SharedDashboard = lazy(() => import('./pages/SharedDashboard'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const Team = lazy(() => import('./pages/Team'))

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    </div>
  )
}

function AnimatedRoute({ children }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingFallback />}>
        <AnimatePresence mode="wait">
          <Routes key={location.pathname}>
            <Route path="/" element={<AnimatedRoute><LandingPage /></AnimatedRoute>} />
            <Route path="/login" element={<AnimatedRoute><Login /></AnimatedRoute>} />
            <Route path="/signup" element={<AnimatedRoute><Signup /></AnimatedRoute>} />
            <Route path="/forgot-password" element={<AnimatedRoute><ForgotPassword /></AnimatedRoute>} />
            <Route path="/reset-password" element={<AnimatedRoute><ResetPassword /></AnimatedRoute>} />
            <Route path="/pricing" element={<AnimatedRoute><Pricing /></AnimatedRoute>} />
            <Route path="/settings" element={
              <AnimatedRoute>
                <AuthGuard><Settings /></AuthGuard>
              </AnimatedRoute>
            } />
            <Route path="/dashboard" element={
              <AnimatedRoute>
                <AuthGuard><Dashboard /></AuthGuard>
              </AnimatedRoute>
            } />
            <Route path="/dashboards" element={
              <AnimatedRoute>
                <AuthGuard><Dashboards /></AuthGuard>
              </AnimatedRoute>
            } />
            <Route path="/team" element={
              <AnimatedRoute>
                <AuthGuard><Team /></AuthGuard>
              </AnimatedRoute>
            } />
            <Route path="/shared/:token" element={<AnimatedRoute><SharedDashboard /></AnimatedRoute>} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </AuthProvider>
  )
}
