import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Database, AlertTriangle, BarChart2 } from 'lucide-react'
import KPICard from '../components/KPICard'
import ChartCard from '../components/ChartCard'
import DynamicChart from '../components/DynamicChart'
import InsightBanner from '../components/InsightBanner'
import { getDashboardByToken } from '../utils/supabase'

export default function SharedDashboard() {
  const { token } = useParams()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return }
    getDashboardByToken(token).then(data => {
      if (data) setDashboard(data)
      else setNotFound(true)
      setLoading(false)
    }).catch(() => { setNotFound(true); setLoading(false) })
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080c] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#08080c] flex items-center justify-center p-6">
        <div className="text-center">
          <AlertTriangle size={40} className="text-slate-600 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-white mb-2">Dashboard not found</h1>
          <p className="text-sm text-slate-500 mb-6">This link may have expired or been removed.</p>
          <Link to="/" className="glow-btn rounded-xl px-6 py-2.5 text-sm font-semibold text-white inline-block">Go home</Link>
        </div>
      </div>
    )
  }

  const result = dashboard.result_json
  const query = dashboard.query_text

  return (
    <div className="min-h-screen bg-[#08080c] text-slate-200">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Database size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm">DataMind AI</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
            Read-only view
          </span>
          <Link to="/signup" className="glow-btn rounded-lg px-3 py-1.5 text-xs font-semibold text-white">
            Try free →
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {/* Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">{result?.understood_intent || query}</h1>
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <BarChart2 size={14} />
              Shared from {dashboard.csv_name || 'a dataset'} · {new Date(dashboard.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>

          {/* KPIs */}
          {result?.kpis?.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {result.kpis.map((kpi, i) => (
                <KPICard key={i} {...kpi} trendDirection={kpi.trend_direction} delay={i} />
              ))}
            </div>
          )}

          {/* Charts */}
          {result?.charts?.length > 0 && (
            <div className="space-y-4 mb-6">
              <div>
                <ChartCard chart={result.charts[0]} index={0} title={result.charts[0].title} subtitle={result.charts[0].subtitle} reason={result.charts[0].reason}>
                  <div style={{ height: 380 }}>
                    <DynamicChart type={result.charts[0].type} data={result.charts[0].data} xKey={result.charts[0].xKey} yKeys={result.charts[0].yKeys} plan="pro" />
                  </div>
                </ChartCard>
              </div>
              {result.charts.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.charts.slice(1).map((chart, i) => (
                    <ChartCard key={i + 1} chart={chart} index={i + 1} title={chart.title} subtitle={chart.subtitle} reason={chart.reason}>
                      <div style={{ height: 280 }}>
                        <DynamicChart type={chart.type} data={chart.data} xKey={chart.xKey} yKeys={chart.yKeys} plan="pro" />
                      </div>
                    </ChartCard>
                  ))}
                </div>
              )}
              <InsightBanner insight={result.ai_insight} anomalies={result.anomalies} />
            </div>
          )}

          {/* Trend analysis */}
          {result?.trend_analysis && (
            <div className="glass rounded-xl p-4 border border-white/5">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">Analysis</p>
              <p className="text-sm text-slate-300 leading-relaxed">{result.trend_analysis}</p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-10 glass rounded-2xl p-6 border border-primary/10 text-center">
            <p className="text-sm font-semibold text-white mb-1">Want to analyse your own data?</p>
            <p className="text-xs text-slate-400 mb-4">Upload any CSV or Excel file and get AI-powered charts & insights in seconds — free.</p>
            <Link to="/signup" className="glow-btn rounded-xl px-6 py-2.5 text-sm font-semibold text-white inline-block">
              Try DataMind AI free →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
