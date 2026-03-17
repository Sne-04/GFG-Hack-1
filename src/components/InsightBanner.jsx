import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function InsightBanner({ text, anomalies = [] }) {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    if (!text) return
    setDisplayed('')
    let i = 0
    const timer = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++ }
      else clearInterval(timer)
    }, 25)
    return () => clearInterval(timer)
  }, [text])

  if (!text) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="glass rounded-xl p-5 mt-4"
      style={{ borderLeft: '3px solid #6366f1' }}
    >
      {/* Anomaly badges */}
      {anomalies?.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-3">
          {anomalies.map((a, i) => (
            <span key={i} className="text-[10px] px-3 py-1 rounded-full" style={{
              background: 'rgba(251,146,60,0.15)',
              border: '1px solid rgba(251,146,60,0.3)',
              color: '#fb923c'
            }}>
              ⚠ {a}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <Bot size={16} className="text-primary" />
        <span className="text-xs font-semibold text-primary">🤖 AI Insight</span>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">
        {displayed}<span className="animate-pulse text-primary">|</span>
      </p>
    </motion.div>
  )
}
