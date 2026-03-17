import { useState, useRef } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

const SAMPLE_CHIPS = [
  { emoji: '📈', text: 'Monthly revenue trend' },
  { emoji: '🗺', text: 'Compare sales by region' },
  { emoji: '🏆', text: 'Top 5 products by revenue' }
]

export default function QueryInput({ onSubmit, hasData, recentQueries = [] }) {
  const [query, setQuery] = useState('')
  const [shake, setShake] = useState(false)
  const [chipsHidden, setChipsHidden] = useState(false)
  const inputRef = useRef(null)

  const handleSubmit = (q) => {
    const text = q || query
    if (!text.trim()) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
    if (!hasData) {
      alert('Please upload a CSV file first')
      return
    }
    onSubmit(text.trim())
    setQuery('')
    setChipsHidden(true)
  }

  return (
    <div>
      {/* Recent query pills */}
      {recentQueries.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-2">
          {recentQueries.slice(0, 3).map((q, i) => (
            <button key={i} onClick={() => handleSubmit(q)} className="text-[10px] px-2 py-1 glass rounded-md text-slate-400 hover:text-primary hover:border-primary/30 transition-all">
              {q.length > 30 ? q.slice(0, 30) + '...' : q}
            </button>
          ))}
        </div>
      )}

      {/* Main input */}
      <motion.div
        animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex gap-2"
      >
        <div className="flex-1 glass rounded-xl flex items-center px-4 focus-within:ring-1 focus-within:ring-primary/40 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all">
          <Sparkles size={14} className="text-primary mr-2 shrink-0"/>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Ask anything... e.g. Show Q3 revenue by region"
            className="flex-1 bg-transparent py-3 text-sm outline-none text-slate-200 placeholder:text-slate-500"
          />
        </div>
        <button onClick={() => handleSubmit()} className="glow-btn rounded-xl px-5 flex items-center gap-2 text-sm font-medium text-white shrink-0">
          <Send size={14}/>Send
        </button>
      </motion.div>

      {/* Sample query chips — show only when data is loaded and no queries yet */}
      {!chipsHidden && !recentQueries.length && hasData && (
        <div className="flex gap-2 flex-wrap mt-3">
          {SAMPLE_CHIPS.map((c, i) => (
            <button key={i} onClick={() => handleSubmit(`${c.emoji} ${c.text}`)}
              className="text-[11px] px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
              style={{
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.3)',
                color: '#a5b4fc'
              }}
              onMouseEnter={e => e.target.style.background = 'rgba(99,102,241,0.2)'}
              onMouseLeave={e => e.target.style.background = 'rgba(99,102,241,0.1)'}
            >
              {c.emoji} {c.text}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
