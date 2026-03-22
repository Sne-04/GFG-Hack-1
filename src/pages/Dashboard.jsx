import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, Plus, FileSpreadsheet, ChevronRight, AlertTriangle, Code, TrendingUp, Download, X, Sparkles, Save, Home, Sun, Moon, Lock, CheckCircle } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import ParticleBackground from '../components/ParticleBackground'
import CSVUpload from '../components/CSVUpload'
import QueryInput from '../components/QueryInput'
import LoadingSteps from '../components/LoadingSteps'
import KPICard from '../components/KPICard'
import ChartCard from '../components/ChartCard'
import DynamicChart from '../components/DynamicChart'
import InsightBanner from '../components/InsightBanner'
import FilterBar from '../components/FilterBar'
import Header from '../components/Header'
import AIChat from '../components/AIChat'
import UserMenu from '../components/UserMenu'
import OnboardingTour from '../components/OnboardingTour'
import { useAuth } from '../contexts/AuthContext'
import { parseCSV, getSchema, getSampleRows, getCategoricalColumns } from '../utils/csvParser'
import { parseXLSX } from '../utils/xlsxParser'
import { queryOpenAI } from '../utils/openaiApi'
import { buildPreComputedContext } from '../utils/dataEngine'
import { validateAndFixResponse } from '../utils/responseValidator'
import { saveQuery, getRecentQueries, saveDashboard, incrementDailyUsage, getDashboardCount } from '../utils/supabase'
import { checkQueryQuota, getPlanLimits, checkDashboardQuota } from '../utils/quota'

export default function Dashboard() {
  const { user, supabaseEnabled, plan, usage, refreshPlan } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [upgradeBanner, setUpgradeBanner] = useState(false)
  const [csvData, setCsvData] = useState(null)
  const [csvFile, setCsvFile] = useState(null)
  const [schema, setSchema] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [recentQueries, setRecentQueries] = useState([])
  const [activeFilters, setActiveFilters] = useState({})
  const [theme, setTheme] = useState(() => localStorage.getItem('datamind-theme') || 'indigo')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('datamind-mode') !== 'light')
  const [resultTab, setResultTab] = useState('sql')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const contentRef = useRef(null)
  const outputRef = useRef(null)

  // Show upgrade banner when redirected from pricing after successful activation
  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      setUpgradeBanner(true)
      setSearchParams({}, { replace: true }) // clean URL
      // Force refresh plan so new plan shows immediately
      if (user) refreshPlan(user.id)
      const t = setTimeout(() => setUpgradeBanner(false), 6000)
      return () => clearTimeout(t)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load recent queries from DB on mount + restore saved dashboard if navigated from /dashboards
  useEffect(() => {
    const restore = sessionStorage.getItem('datamind-restore')
    if (restore) {
      try {
        const { result, query, csvName, schema: savedSchema } = JSON.parse(restore)
        setResult({ ...result, query })
        setCsvFile(csvName)
        setSchema(savedSchema)
      } catch { /* ignore bad data */ }
      sessionStorage.removeItem('datamind-restore')
    }

    if (user && supabaseEnabled) {
      // Free plan shows last 20 queries; Pro/Enterprise show more
      getRecentQueries(user.id, 20).then(queries => {
        if (queries.length) {
          setRecentQueries(queries.map(q => q.query_text))
        }
      }).catch(() => {})
    }
  }, [user, supabaseEnabled])

  // Apply dark/light mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove('light-mode')
      document.documentElement.classList.add('dark-mode')
    } else {
      document.documentElement.classList.remove('dark-mode')
      document.documentElement.classList.add('light-mode')
    }
    localStorage.setItem('datamind-mode', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const themeColors = { indigo: '#6366f1', emerald: '#10b981' }

  const handleUpload = useCallback(async (file) => {
    try {
      const ext = file.name.split('.').pop().toLowerCase()
      const parsed = (ext === 'xlsx' || ext === 'xls')
        ? await parseXLSX(file)
        : await parseCSV(file)
      setCsvData(parsed)
      setCsvFile(file.name)
      setSchema(getSchema(parsed.columns, parsed.data))
      setResult(null)
      setError(null)
    } catch (e) {
      console.error(e)
      // Browser FileReader security error — file reference revoked after drag/select
      const isReadError = e?.message?.toLowerCase().includes('could not be read') ||
        e?.message?.toLowerCase().includes('permission') ||
        e?.name === 'NotReadableError'
      setError(isReadError
        ? 'Could not read the file. Try dragging it again or use the file picker to browse.'
        : `Could not parse file: ${e.message || 'Please try again.'}`)
    }
  }, [])

  const loadDemoData = useCallback(async () => {
    try {
      const response = await fetch('/demo_sales.csv')
      const text = await response.text()
      const file = new File([text], 'demo_sales.csv', { type: 'text/csv' })
      handleUpload(file)
    } catch (e) {
      console.error(e)
      setError(`Demo Error: ${e.message}`)
    }
  }, [handleUpload])

  const clearData = useCallback(() => {
    setCsvData(null)
    setCsvFile(null)
    setResult(null)
    setSchema(null)
    setActiveFilters({})
    setError(null)
  }, [])

  const handleQuery = useCallback(async (query, overrideFilters = null) => {
    if (!csvData) { setError('Please upload a CSV or Excel file first'); return }

    // Check quota before querying
    if (user && supabaseEnabled) {
      const quota = checkQueryQuota(usage, plan)
      if (!quota.allowed) {
        setError(quota.reason)
        return
      }
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setRecentQueries(p => [query, ...p.filter(q => q !== query)].slice(0, 20))

    // Append active filters to query
    const filtersToUse = overrideFilters || activeFilters
    const filterStr = Object.entries(filtersToUse).filter(([,v]) => v).map(([k,v]) => `${k}=${v}`).join(', ')
    const fullQuery = filterStr ? `${query} (filter: ${filterStr})` : query

    try {
      const sample = getSampleRows(csvData.data, 10)
      // Pre-compute real stats from all data rows
      const preComputed = buildPreComputedContext(csvData.data, csvData.columns, schema)
      const res = await queryOpenAI(fullQuery, schema, sample, csvData.rowCount, [], preComputed)
      if (res.cannot_answer) {
        setError(res.cannot_answer_reason || 'Cannot answer this question with available data.')
      } else {
        // Validate and fix AI response against real computed data
        const validated = validateAndFixResponse(res, preComputed, csvData.columns)
        setResult({ ...validated, query })
        setSaved(false)
        // Save query to DB and track usage if authenticated
        if (user && supabaseEnabled) {
          saveQuery(user.id, query, validated, csvFile).catch(() => {})
          incrementDailyUsage(user.id).then(() => refreshPlan(user.id)).catch(() => {})
        }
      }
    } catch (e) {
      setError(e.message || 'Something went wrong. Try asking in a different way.')
    }
    setLoading(false)
    // Auto-scroll to results
    setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
  }, [csvData, schema, activeFilters, user, supabaseEnabled, csvFile, plan, usage, refreshPlan])

  const handleFilterChange = useCallback((col, val) => {
    setActiveFilters(p => {
      const newFilters = { ...p, [col]: val }
      if (result && result.query) {
        setTimeout(() => handleQuery(result.query, newFilters), 0)
      }
      return newFilters
    })
  }, [result, handleQuery])

  const filters = csvData ? getCategoricalColumns(csvData.columns, csvData.data)
    .slice(0, 4)
    .map(col => ({
      column: col,
      values: [...new Set(csvData.data.map(r => r[col]).filter(Boolean))].slice(0, 15)
    })) : []

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden relative w-full transition-colors duration-300 ${darkMode ? 'bg-[#08080c] text-slate-200' : 'bg-[#f0f2f5] text-slate-800'}`}>
      <OnboardingTour />

      {/* Upgrade success banner */}
      <AnimatePresence>
        {upgradeBanner && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-xl font-medium text-sm"
          >
            <CheckCircle size={18} />
            🎉 Plan activated! You now have {plan === 'pro' ? 'Pro' : plan === 'enterprise' ? 'Enterprise' : 'upgraded'} access.
            <button onClick={() => setUpgradeBanner(false)} className="ml-2 opacity-70 hover:opacity-100"><X size={14}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/70 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
      
      {/* LEFT SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 transform transition-all md:relative md:translate-x-0 w-60 border-r flex flex-col shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${darkMode ? 'bg-[#08080c] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className={`p-4 border-b flex items-center justify-between ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Database size={14} className="text-white" />
            </div>
            <span className="font-bold text-[16px] tracking-tight">DataMind AI</span>
          </Link>
          <button className="md:hidden text-slate-400 hover:text-white px-2" onClick={() => setIsSidebarOpen(false)} aria-label="Close sidebar">✕</button>
        </div>

        <div className="p-4 space-y-2">
          <button onClick={() => { setResult(null); setError(null) }} className="w-full glow-btn rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 text-white">
            <Plus size={14}/>New Dashboard
          </button>
          {user && supabaseEnabled && (
            <Link to="/dashboards" className="w-full flex items-center justify-center gap-1.5 glass rounded-lg py-2 text-xs text-slate-400 hover:text-primary hover:border-primary/30 transition-all">
              <Database size={12}/>My Dashboards
            </Link>
          )}
        </div>

        {/* Quota badge */}
        {user && supabaseEnabled && (() => {
          const limits = getPlanLimits(plan)
          const used = usage?.today_count || 0
          const limit = limits.queriesPerDay
          const isUnlimited = limit === -1
          return (
            <div className="px-4 mb-2">
              <div className="glass rounded-lg p-2.5 border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Today's Queries</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${plan === 'free' ? 'bg-slate-500/15 text-slate-400' : plan === 'pro' ? 'bg-primary/15 text-primary' : 'bg-emerald-500/15 text-emerald-400'}`}>
                    {plan === 'free' ? 'FREE' : plan.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-white/5' : 'bg-slate-200'}`}>
                    <div
                      className={`h-full rounded-full transition-all ${isUnlimited || used / limit < 0.8 ? 'bg-primary' : used / limit < 1 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: isUnlimited ? '15%' : `${Math.min(100, (used / limit) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium tabular-nums">
                    {isUnlimited ? `${used} used` : `${used}/${limit}`}
                  </span>
                </div>
                {!isUnlimited && used >= limit && (
                  <a href="/pricing" className="w-full mt-2 block text-center text-[9px] bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-md py-1 transition-colors">
                    ↑ Upgrade for more queries
                  </a>
                )}
                {!isUnlimited && used < limit && plan === 'free' && (
                  <a href="/pricing" className="w-full mt-1.5 block text-center text-[9px] text-slate-500 hover:text-primary transition-colors">
                    Upgrade to Pro →
                  </a>
                )}
              </div>
            </div>
          )
        })()}

        {/* Recent Queries */}
        <div className="flex-1 overflow-y-auto px-4">
          <p className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Recent Queries</p>
          <div className="space-y-1">
            {(plan === 'free' ? recentQueries.slice(0, 20) : recentQueries).map((q, i) => (
              <button key={i} onClick={() => handleQuery(q)} className={`w-full text-left text-[10px] text-slate-400 hover:text-primary px-2 py-1.5 rounded-lg transition-all truncate ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}>
                <ChevronRight size={8} className="inline mr-1"/>{q}
              </button>
            ))}
            {!recentQueries.length && <p className="text-[10px] text-slate-600 italic">No queries yet</p>}
          </div>
        </div>

        {/* Theme + Data Source */}
        <div className={`p-4 border-t space-y-3 ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Theme</p>
            {/* Dark / Light toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-full flex items-center gap-2 glass rounded-lg px-2.5 py-2 text-[10px] font-medium hover:border-primary/30 transition-all mb-2`}
              title={darkMode ? 'Switch to Light mode' : 'Switch to Dark mode'}
            >
              {darkMode ? <Sun size={12} className="text-amber-400"/> : <Moon size={12} className="text-indigo-500"/>}
              <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                {darkMode ? 'Switch to Light' : 'Switch to Dark'}
              </span>
            </button>
            {/* Accent color picker */}
            <div className="flex items-center gap-2">
              <span className={`text-[9px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Accent:</span>
              {Object.entries(themeColors).map(([k, c]) => (
                <button
                  key={k}
                  onClick={() => { setTheme(k); localStorage.setItem('datamind-theme', k) }}
                  title={k === 'indigo' ? 'Indigo (Purple)' : 'Emerald (Green)'}
                  className={`flex items-center gap-1 text-[9px] rounded-md px-1.5 py-0.5 transition-all border ${
                    theme === k
                      ? `border-current font-semibold ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`
                      : `border-transparent opacity-50 hover:opacity-80`
                  }`}
                  style={{ color: c }}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c }}/>
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Data Source</p>
            {csvFile ? (
              <div className="glass rounded-lg p-2 text-[10px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <FileSpreadsheet size={10}/>
                    <span className="truncate max-w-[120px]">{csvFile}</span>
                  </div>
                  <button onClick={clearData} className="text-slate-500 hover:text-red-400 p-1" title="Clear Data">
                    <X size={12} />
                  </button>
                </div>
                <p className="text-slate-500 mt-1">{csvData?.rowCount} rows</p>
              </div>
            ) : (
              <div className="space-y-2">
                <CSVUpload onUpload={handleUpload} compact />
                <button onClick={loadDemoData} className="w-full text-center border border-primary/30 text-primary hover:bg-primary/10 rounded-lg py-1.5 text-[9px] font-medium transition-colors">
                  Try with demo data →
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[9px] text-emerald-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
              Ready
            </div>
            <UserMenu />
          </div>

          {/* Community support link — available to all plans */}
          <a
            href="mailto:support@datamind.ai?subject=DataMind%20AI%20Support"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 text-xs mt-2 px-3 py-2 rounded-lg border transition-all duration-200 ${darkMode ? 'text-slate-400 hover:text-white border-white/5 hover:border-primary/30 hover:bg-primary/10' : 'text-slate-500 hover:text-primary border-slate-200 hover:border-primary/30 hover:bg-primary/5'}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Community & Support
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto z-10 w-full flex flex-col relative">
        {/* Mobile Header (visible only on md:hidden) */}
        <div className={`md:hidden flex items-center justify-between p-4 border-b sticky top-0 z-20 ${darkMode ? 'border-white/5 bg-[#08080c]' : 'border-slate-200 bg-white'}`}>
          <button onClick={() => setIsSidebarOpen(true)} aria-label="Open sidebar menu" className="text-slate-300 pointer-events-auto">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <Link to="/" className="font-bold text-sm">DataMind</Link>
          <button onClick={() => setIsRightPanelOpen(true)} className="text-xs bg-primary/20 text-primary px-3 py-1.5 rounded-lg font-medium pointer-events-auto">
            AI Chat
          </button>
        </div>

        <div id="dashboard-content" ref={contentRef} className="p-3 md:p-6 w-full max-w-5xl mx-auto flex-1 flex flex-col">
          {!csvData && !result && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-16 sm:mt-24 max-w-2xl mx-auto w-full">
              <div className={`rounded-2xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden group ${darkMode ? 'glass border border-white/5 shadow-primary/5' : 'bg-white border border-slate-200 shadow-slate-200/50'}`}>
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mb-6 ring-1 ring-white/10 group-hover:ring-primary/30 transition-all duration-500">
                  <Database size={32} className="text-primary/80" />
                </div>
                <h2 className={`text-3xl font-bold mb-3 tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>Welcome to <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">DataMind AI</span></h2>
                <p className={`mb-10 max-w-md mx-auto leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Instantly transform any raw CSV data into interactive intelligence. Upload your dataset or start with our playground data.</p>
                <div className="max-w-xs mx-auto space-y-4 relative z-10 flex flex-col items-center">
                  <div className="w-full"><CSVUpload onUpload={handleUpload} /></div>
                  <button onClick={loadDemoData} className={`w-full text-center hover:border-primary/30 hover:bg-primary/10 hover:text-primary rounded-xl py-3.5 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${darkMode ? 'border border-white/5 bg-black/40 text-slate-300' : 'border border-slate-200 bg-slate-50 text-slate-500'}`}>
                    <Sparkles size={16} /> Try with demo playground
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {csvData && !result && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Header title="New Dashboard" subtitle={`${csvFile} • ${csvData.rowCount} rows • ${csvData.columns.length} columns`} />
              <div className="glass rounded-xl p-4 mb-4">
                <p className="text-xs text-slate-400">
                  <span className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{csvData.columns.length} Columns detected.</span>
                  <span className="hidden sm:inline pl-2">
                    {csvData.columns.slice(0, 6).join(', ')}{csvData.columns.length > 6 ? ' ...' : ''}
                  </span>
                </p>
              </div>
              {/* Filter Bar */}
              {filters.length > 0 && (
                <div className="mb-4">
                  <FilterBar filters={filters} activeFilters={activeFilters} onChange={handleFilterChange} />
                </div>
              )}
            </motion.div>
          )}

          {loading && <LoadingSteps />}

          {error && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-6 text-center mt-8 border-red-500/20">
              <AlertTriangle size={24} className="text-red-400 mx-auto mb-2"/>
              <p className="text-sm text-red-300">{error}</p>
              <button onClick={() => setError(null)} className="text-xs text-primary mt-3 underline">Dismiss</button>
            </motion.div>
          )}

          {result && !loading && (
            <motion.div ref={outputRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Filter Bar when result is shown - moved to top above main title */}
              {filters.length > 0 && <div className="mb-4"><FilterBar filters={filters} activeFilters={activeFilters} onChange={handleFilterChange} /></div>}

              {/* Main Header Row with Title and Anomalies inline */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold">{result.understood_intent || result.query}</h1>
                  <p className="text-sm text-slate-400 mt-1">AI-generated dashboard based on your query</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {result.anomalies?.length > 0 && result.anomalies.map((a, i) => (
                    <span key={i} className="text-[10px] px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400"/> {a}
                    </span>
                  ))}
                  {user && supabaseEnabled && (
                    <button onClick={async () => {
                      try {
                        // Fetch real dashboard count then enforce free plan limit (3)
                        const currentCount = await getDashboardCount(user.id)
                        const quota = checkDashboardQuota(currentCount, plan)
                        if (!quota.allowed) {
                          alert(quota.reason)
                          return
                        }
                        await saveDashboard(user.id, csvFile, schema, result, result.query)
                        setSaved(true)
                      } catch (e) {
                        alert(e?.message || 'Failed to save dashboard')
                        console.error(e)
                      }
                    }} disabled={saved}
                      className={`glass rounded-lg px-4 py-2 text-xs font-medium flex items-center gap-2 transition-all ml-2 ${saved ? 'text-emerald-400 border-emerald-500/30' : 'hover:border-primary/30'}`}>
                      <Save size={14}/>{saved ? 'Saved' : 'Save'}
                    </button>
                  )}
                  {/* PNG export — all plans */}
                  <button onClick={() => {
                    import('html2canvas').then(({ default: html2canvas }) => {
                      const el = document.getElementById('dashboard-content')
                      if (!el) return
                      html2canvas(el, { backgroundColor: '#0a0a0f', scale: 2 }).then(canvas => {
                        const link = document.createElement('a')
                        link.download = 'datamind-dashboard.png'
                        link.href = canvas.toDataURL()
                        link.click()
                      })
                    })
                  }} className="glass rounded-lg px-4 py-2 text-xs font-medium flex items-center gap-2 hover:border-primary/30 transition-all ml-2">
                    <Download size={14}/>PNG
                  </button>
                  {/* PDF export — Pro+ */}
                  {plan === 'free' ? (
                    <a href="/pricing" title="Upgrade to Pro for PDF export" className="glass rounded-lg px-4 py-2 text-xs font-medium flex items-center gap-2 text-slate-500 cursor-pointer hover:border-primary/20 transition-all ml-2">
                      <Lock size={12}/>PDF
                    </a>
                  ) : (
                    <button onClick={() => {
                      import('html2canvas').then(({ default: html2canvas }) => {
                        const el = document.getElementById('dashboard-content')
                        if (!el) return
                        html2canvas(el, { backgroundColor: '#0a0a0f', scale: 1.5 }).then(canvas => {
                          const imgData = canvas.toDataURL('image/jpeg', 0.85)
                          const w = window.open('', '_blank')
                          w.document.write(`<html><head><title>DataMind Dashboard</title><style>body{margin:0;background:#0a0a0f}img{width:100%;height:auto}</style></head><body><img src="${imgData}" onload="window.print()"/></body></html>`)
                          w.document.close()
                        })
                      })
                    }} className="glass rounded-lg px-4 py-2 text-xs font-medium flex items-center gap-2 hover:border-primary/30 transition-all ml-2">
                      <Download size={14}/>PDF
                    </button>
                  )}
                  {/* PPT export — Enterprise only */}
                  {plan !== 'enterprise' ? (
                    <a href="/pricing" title="Upgrade to Enterprise for PPT export" className="glass rounded-lg px-4 py-2 text-xs font-medium flex items-center gap-2 text-slate-500 cursor-pointer hover:border-primary/20 transition-all ml-2">
                      <Lock size={12}/>PPT
                    </a>
                  ) : (
                    <button onClick={() => alert('PPT export: contact support@datamind.ai for your enterprise export file.')} className="glass rounded-lg px-4 py-2 text-xs font-medium flex items-center gap-2 hover:border-emerald-500/30 transition-all ml-2">
                      <Download size={14}/>PPT
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons (SQL / Description) */}
              <div className="flex gap-3 mb-6">
                <button onClick={() => setResultTab('sql')} className={`text-xs px-4 py-2 rounded-lg transition-all font-medium border ${resultTab === 'sql' ? `bg-primary/20 border-primary/30 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}` : `glass text-slate-400 border-white/5 hover:border-primary/20 ${darkMode ? 'hover:text-slate-200' : 'hover:text-slate-700'}`}`}>
                  How we found the answer
                </button>
                <button onClick={() => setResultTab('trend')} className={`text-xs px-4 py-2 rounded-lg transition-all font-medium border ${resultTab === 'trend' ? `bg-primary/20 border-primary/30 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}` : `glass text-slate-400 border-white/5 hover:border-primary/20 ${darkMode ? 'hover:text-slate-200' : 'hover:text-slate-700'}`}`}>
                  What&apos;s happening with your data
                </button>
              </div>

              {/* Content Panel for SQL/Trend */}
              {(resultTab === 'sql' || resultTab === 'trend') && (
                <div className="glass rounded-xl p-4 mb-6 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/50"></div>
                  {resultTab === 'sql' && result.sql_logic && (
                    <pre className="text-xs text-secondary font-mono bg-black/40 rounded-lg p-4 overflow-x-auto border border-white/5 whitespace-pre-wrap break-words"><code>{result.sql_logic}</code></pre>
                  )}
                  {resultTab === 'trend' && result.trend_analysis && (
                    <p className="text-sm text-slate-300 leading-relaxed px-2">{result.trend_analysis}</p>
                  )}
                </div>
              )}

              {/* KPI Cards */}
              {result.kpis?.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 overflow-hidden">
                  {result.kpis.map((kpi, i) => (
                    <KPICard key={i} {...kpi} trendDirection={kpi.trend_direction} delay={i} darkMode={darkMode} />
                  ))}
                </div>
              )}

              {/* Charts Grid — Fix 7 Multi-chart Logic */}
              {result.charts?.filter(Boolean).length > 0 && (
                <div>
                  {/* First chart - full width */}
                  <div style={{marginBottom: '16px'}}>
                    <ChartCard chart={result.charts[0]} index={0} title={result.charts[0]?.title} subtitle={result.charts[0]?.subtitle} reason={result.charts[0]?.reason} darkMode={darkMode}>
                      <div style={{ height: 400 }}>
                        <DynamicChart type={result.charts[0]?.type} data={result.charts[0]?.data} xKey={result.charts[0]?.xKey} yKeys={result.charts[0]?.yKeys} plan={plan} />
                      </div>
                    </ChartCard>
                  </div>

                  {/* Remaining charts - 2 column grid */}
                  {result.charts.filter(Boolean).length > 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {result.charts.filter(Boolean).slice(1).map((chart, i) => (
                        <ChartCard key={i+1} chart={chart} index={i+1} title={chart?.title} subtitle={chart?.subtitle} reason={chart?.reason} darkMode={darkMode}>
                          <div style={{ height: 300 }}>
                            <DynamicChart type={chart?.type} data={chart?.data} xKey={chart?.xKey} yKeys={chart?.yKeys} plan={plan} />
                          </div>
                        </ChartCard>
                      ))}
                    </div>
                  )}
                  
                  {/* AI Insight Banner from Fix 5 */}
                  <InsightBanner 
                    insight={result.ai_insight}
                    anomalies={result.anomalies}
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* Query Input */}
          {csvData && (
            <div className={`sticky bottom-0 mt-auto z-30 pt-4 pb-4 md:pb-2 border-t md:border-t-0 p-3 md:p-0 ${darkMode ? 'bg-[#08080c] md:bg-gradient-to-t md:from-[#08080c] md:via-[#08080c]/90 md:to-transparent border-white/5' : 'bg-[#f4f6f9] md:bg-gradient-to-t md:from-[#f4f6f9] md:via-[#f4f6f9]/90 md:to-transparent border-slate-200'}`}>
              <QueryInput onSubmit={handleQuery} hasData={!!csvData} recentQueries={recentQueries} />
            </div>
          )}
        </div>
      </main>

      {/* Mobile Right Overlay */}
      {isRightPanelOpen && <div className="fixed inset-0 bg-black/70 z-40 md:hidden" onClick={() => setIsRightPanelOpen(false)} />}

      {/* RIGHT PANEL — bottom sheet on mobile, fixed sidebar on desktop */}
      <aside className={`fixed z-50 transform transition-all flex flex-col shrink-0
        bottom-0 left-0 right-0 h-[80vh] rounded-t-2xl border-t
        md:relative md:inset-y-auto md:left-auto md:right-auto md:h-auto md:w-80 md:rounded-none md:border-t-0 md:border-l md:translate-y-0
        ${isRightPanelOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
        ${darkMode ? 'bg-[#08080c] border-white/5' : 'bg-white border-slate-200'}`}>
        {/* Drag handle (mobile only) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className={`w-10 h-1 rounded-full ${darkMode ? 'bg-white/20' : 'bg-slate-300'}`} />
        </div>
        <div className={`flex border-b items-center p-4 ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <button className={`md:hidden text-slate-400 px-2 mr-2 border-r transition-colors ${darkMode ? 'hover:text-white border-white/5' : 'hover:text-slate-700 border-slate-100'}`} onClick={() => setIsRightPanelOpen(false)} aria-label="Close chat panel">✕</button>
          <span className={`font-bold text-sm ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>AI Assistant</span>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className={`flex-1 overflow-y-auto p-4 border-b ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
            <AIChat darkMode={darkMode} context={(() => {
              const parts = []
              if (csvData) {
                parts.push(`CSV Columns: ${csvData.columns.join(', ')}`)
                parts.push(`Total Rows: ${csvData.rowCount}`)
                // Include pre-computed stats for accurate chat responses
                const chatStats = buildPreComputedContext(csvData.data, csvData.columns, schema)
                parts.push(`Column Statistics: ${JSON.stringify(chatStats.stats)}`)
                if (chatStats.anomalies.length) parts.push(`Data Anomalies: ${chatStats.anomalies.join('; ')}`)
              }
              if (result) {
                parts.push(`Dashboard KPIs: ${JSON.stringify(result.kpis)}`)
                parts.push(`AI Insight: ${result.ai_insight}`)
                parts.push(`User Query: ${result.query}`)
                if (result.anomalies) parts.push(`Anomalies: ${JSON.stringify(result.anomalies)}`)
                if (result.trend_analysis) parts.push(`Trend Analysis: ${result.trend_analysis}`)
              }
              return parts.length > 0 ? parts.join('\n') : 'No data uploaded yet. Please upload a CSV file first.'
            })()} />
          </div>
          {csvData ? (
            <div className={`h-64 overflow-y-auto p-4 ${darkMode ? 'bg-black/20' : 'bg-slate-50'}`}>
              <p className="text-xs text-slate-400 mb-3 font-semibold tracking-wider uppercase">CSV Columns ({csvData.columns.length})</p>
              <div className="space-y-1.5">
                {csvData.columns.map(col => (
                  <div key={col} className="glass rounded-lg p-2">
                    <p className={`text-[10px] font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{col}</p>
                    <p className="text-[9px] text-slate-500 truncate">{csvData.data.slice(0, 3).map(r => r[col]).join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={`h-64 flex items-center justify-center ${darkMode ? 'bg-black/20' : 'bg-slate-50'}`}>
              <p className="text-[10px] text-slate-600 italic">No data uploaded</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
