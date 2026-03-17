import { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Database, Plus, FileSpreadsheet, ChevronRight, AlertTriangle, Code, TrendingUp, Download } from 'lucide-react'
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
import { parseCSV, getSchema, getSampleRows, getCategoricalColumns } from '../utils/csvParser'
import { queryOpenAI } from '../utils/openaiApi'

export default function Dashboard() {
  const [csvData, setCsvData] = useState(null)
  const [csvFile, setCsvFile] = useState(null)
  const [schema, setSchema] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [recentQueries, setRecentQueries] = useState([])
  const [activeFilters, setActiveFilters] = useState({})
  const [apiKey] = useState(import.meta.env.VITE_OPENAI_API_KEY || '')
  const [theme, setTheme] = useState('purple')
  const [tab, setTab] = useState('queries')
  const [resultTab, setResultTab] = useState('sql')
  const contentRef = useRef(null)
  const outputRef = useRef(null)

  const themeColors = { purple: '#6366f1', cyan: '#22d3ee', green: '#10b981' }

  const handleUpload = useCallback(async (file) => {
    try {
      const parsed = await parseCSV(file)
      setCsvData(parsed)
      setCsvFile(file.name)
      setSchema(getSchema(parsed.columns, parsed.data))
      setResult(null)
      setError(null)
    } catch {
      setError('Invalid CSV file. Please try again.')
    }
  }, [])

  const handleQuery = useCallback(async (query) => {
    if (!csvData) { setError('Please upload a CSV file first'); return }
    if (!apiKey) { setError('API key not configured'); return }
    setLoading(true)
    setError(null)
    setResult(null)
    setRecentQueries(p => [query, ...p.filter(q => q !== query)].slice(0, 10))

    // Append active filters to query
    const filterStr = Object.entries(activeFilters).filter(([,v]) => v).map(([k,v]) => `${k}=${v}`).join(', ')
    const fullQuery = filterStr ? `${query} (filter: ${filterStr})` : query

    try {
      const sample = getSampleRows(csvData.data)
      const res = await queryOpenAI(fullQuery, schema, sample, csvData.rowCount, [], apiKey)
      if (res.cannot_answer) {
        setError(res.cannot_answer_reason || 'Cannot answer this question with available data.')
      } else {
        setResult({ ...res, query })
      }
    } catch (e) {
      setError(e.message || 'AI is thinking... please retry')
    }
    setLoading(false)
    // Auto-scroll to results
    setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
  }, [csvData, schema, apiKey, activeFilters])

  const filters = csvData ? getCategoricalColumns(csvData.columns, csvData.data).map(col => ({
    column: col,
    values: [...new Set(csvData.data.map(r => r[col]).filter(Boolean))].slice(0, 15)
  })) : []

  return (
    <div className="flex h-screen overflow-hidden relative bg-[#08080c]">
      {/* LEFT SIDEBAR */}
      <aside className="w-60 glass border-r border-white/5 flex flex-col z-10 shrink-0">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className="font-bold text-[16px] tracking-tight">DataMind AI</span>
              <span className="text-[9px] text-slate-500 font-medium">Powered by OpenAI</span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <button onClick={() => { setResult(null); setError(null) }} className="w-full glow-btn rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 text-white">
            <Plus size={14}/>New Dashboard
          </button>
        </div>

        {/* Recent Queries */}
        <div className="flex-1 overflow-y-auto px-4">
          <p className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Recent Queries</p>
          <div className="space-y-1">
            {recentQueries.map((q, i) => (
              <button key={i} onClick={() => handleQuery(q)} className="w-full text-left text-[10px] text-slate-400 hover:text-primary px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all truncate">
                <ChevronRight size={8} className="inline mr-1"/>{q}
              </button>
            ))}
            {!recentQueries.length && <p className="text-[10px] text-slate-600 italic">No queries yet</p>}
          </div>
        </div>

        {/* Theme + Data Source */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Theme</p>
            <div className="flex gap-2">
              {Object.entries(themeColors).map(([k, c]) => (
                <button key={k} onClick={() => setTheme(k)} className={`w-5 h-5 rounded-full transition-all ${theme === k ? 'ring-2 ring-offset-2 ring-offset-[#0a0a0f] scale-110' : 'opacity-50 hover:opacity-80'}`} style={{ background: c, ringColor: c }}/>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Data Source</p>
            {csvFile ? (
              <div className="glass rounded-lg p-2 text-[10px]">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <FileSpreadsheet size={10}/>{csvFile}
                </div>
                <p className="text-slate-500 mt-0.5">{csvData?.rowCount} rows</p>
              </div>
            ) : (
              <CSVUpload onUpload={handleUpload} compact />
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[9px] text-emerald-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
            Ready
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto z-10">
        <div id="dashboard-content" ref={contentRef} className="p-6 max-w-5xl mx-auto">
          {!csvData && !result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-20">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Welcome to <span className="text-primary">DataMind AI</span></h2>
                <p className="text-sm text-slate-500">Upload a CSV to start analyzing your data</p>
              </div>
              <div className="max-w-md mx-auto">
                <CSVUpload onUpload={handleUpload} />
              </div>
            </motion.div>
          )}

          {csvData && !result && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Header title="New Dashboard" subtitle={`${csvFile} • ${csvData.rowCount} rows • ${csvData.columns.length} columns`} />
              <div className="glass rounded-xl p-5 mb-4">
                <p className="text-xs text-slate-400 mb-2">Columns detected: <span className="text-slate-200">{csvData.columns.join(', ')}</span></p>
              </div>
              {/* Filter Bar */}
              {filters.length > 0 && (
                <div className="mb-4">
                  <FilterBar filters={filters} activeFilters={activeFilters} onChange={(col, val) => setActiveFilters(p => ({ ...p, [col]: val }))} />
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
              {filters.length > 0 && <div className="mb-4"><FilterBar filters={filters} activeFilters={activeFilters} onChange={(col, val) => setActiveFilters(p => ({ ...p, [col]: val }))} /></div>}

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
                  <button onClick={() => {
                    import('html2canvas').then(({ default: html2canvas }) => {
                      const el = document.getElementById('dashboard-content');
                      if (!el) return;
                      html2canvas(el, { backgroundColor: '#0a0a0f', scale: 2 }).then(canvas => {
                        const link = document.createElement('a');
                        link.download = 'insightforge-dashboard.png';
                        link.href = canvas.toDataURL();
                        link.click();
                      });
                    });
                  }} className="glass rounded-lg px-4 py-2 text-xs font-medium flex items-center gap-2 hover:border-primary/30 transition-all ml-4">
                    <Download size={14}/>Export Dashboard
                  </button>
                </div>
              </div>

              {/* Action Buttons (SQL / Description) */}
              <div className="flex gap-3 mb-6">
                <button onClick={() => setResultTab('sql')} className={`text-xs px-4 py-2 rounded-lg transition-all font-medium border ${resultTab === 'sql' ? 'bg-primary/20 text-indigo-300 border-primary/30' : 'glass text-slate-400 hover:text-slate-200 border-white/5 hover:border-white/10'}`}>
                  Generated SQL Query
                </button>
                <button onClick={() => setResultTab('trend')} className={`text-xs px-4 py-2 rounded-lg transition-all font-medium border ${resultTab === 'trend' ? 'bg-primary/20 text-indigo-300 border-primary/30' : 'glass text-slate-400 hover:text-slate-200 border-white/5 hover:border-white/10'}`}>
                  Description & Trend Analysis
                </button>
              </div>

              {/* Content Panel for SQL/Trend */}
              {(resultTab === 'sql' || resultTab === 'trend') && (
                <div className="glass rounded-xl p-4 mb-6 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/50"></div>
                  {resultTab === 'sql' && result.sql_logic && (
                    <pre className="text-xs text-secondary font-mono bg-black/40 rounded-lg p-4 overflow-x-auto border border-white/5"><code>{result.sql_logic}</code></pre>
                  )}
                  {resultTab === 'trend' && result.trend_analysis && (
                    <p className="text-sm text-slate-300 leading-relaxed px-2">{result.trend_analysis}</p>
                  )}
                </div>
              )}

              {/* KPI Cards */}
              {result.kpis?.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  {result.kpis.map((kpi, i) => (
                    <KPICard key={i} {...kpi} trendDirection={kpi.trend_direction} delay={i} />
                  ))}
                </div>
              )}

              {/* Charts Grid — single full width column */}
              {result.charts?.length > 0 && (
                <div className="space-y-6 mb-8">
                  {result.charts.map((chart, i) => (
                    <ChartCard key={chart.id || i} title={chart.title} subtitle={chart.subtitle} reason={chart.reason} delay={i * 0.1}>
                      <div style={{ height: 400 }}>
                        <DynamicChart type={chart.type} data={chart.data} xKey={chart.xKey} yKeys={chart.yKeys} />
                      </div>
                    </ChartCard>
                  ))}
                </div>
              )}

              {/* Removed separate AI Insight Banner, integrated anomaly display into header */}
            </motion.div>
          )}

          {/* Query Input */}
          {csvData && (
            <div className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent">
              <QueryInput onSubmit={handleQuery} hasData={!!csvData} recentQueries={recentQueries} />
            </div>
          )}
        </div>
      </main>

      {/* RIGHT PANEL */}
      <aside className="w-80 glass border-l border-white/5 flex flex-col z-10 shrink-0">
        <div className="flex border-b border-white/5">
          {['queries', 'chat', 'data'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-[10px] uppercase tracking-wider font-semibold transition-all ${tab === t ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-300'}`}>
              {t === 'chat' ? 'AI Chat' : t}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'queries' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 mb-3">Query History</p>
              {recentQueries.map((q, i) => (
                <button key={i} onClick={() => handleQuery(q)} className="w-full text-left glass rounded-lg p-2 text-[10px] text-slate-300 hover:border-primary/20 transition-all">{q}</button>
              ))}
              {!recentQueries.length && <p className="text-[10px] text-slate-600 italic text-center mt-10">No queries yet.<br/>Upload data and ask a question!</p>}
            </div>
          )}
          {tab === 'chat' && (
            <AIChat context={result ? JSON.stringify({ kpis: result.kpis, insight: result.ai_insight, query: result.query }) : 'No dashboard loaded yet'} apiKey={apiKey} />
          )}
          {tab === 'data' && csvData && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 mb-2">CSV Columns ({csvData.columns.length})</p>
              <div className="space-y-1">
                {csvData.columns.map(col => (
                  <div key={col} className="glass rounded-lg p-2">
                    <p className="text-[10px] font-medium text-slate-200">{col}</p>
                    <p className="text-[9px] text-slate-500 truncate">{csvData.data.slice(0, 3).map(r => r[col]).join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === 'data' && !csvData && <p className="text-[10px] text-slate-600 italic text-center mt-10">No data uploaded</p>}
        </div>
      </aside>
    </div>
  )
}
