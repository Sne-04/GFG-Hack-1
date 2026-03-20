import { useState, useRef } from 'react'
import { Send, Sparkles, HelpCircle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const MAX_QUERY_LENGTH = 500

const SAMPLE_CHIPS = [
  { emoji: '📈', text: 'Monthly revenue trend' },
  { emoji: '🗺', text: 'Compare sales by region' },
  { emoji: '🏆', text: 'Top 5 products by revenue' }
]

const HELP_EXAMPLES = [
  { category: 'Trends', examples: ['Show monthly sales trend', 'How has revenue changed over time?', 'What is the weekly growth rate?'] },
  { category: 'Comparisons', examples: ['Compare revenue by region', 'Which product category performs best?', 'Rank customers by total spend'] },
  { category: 'Summaries', examples: ['Summarize the dataset', 'What are the key metrics?', 'Give me a business overview'] },
  { category: 'Deep Dives', examples: ['Which items have declining sales?', 'Find the top 10 customers', 'Show anomalies in the data'] },
]

export default function QueryInput({ onSubmit, hasData, recentQueries = [] }) {
  const [query, setQuery] = useState('')
  const [shake, setShake] = useState(false)
  const [chipsHidden, setChipsHidden] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
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
    setShowHelp(false)
  }

  return (
    <div className="relative">
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
            maxLength={MAX_QUERY_LENGTH}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Ask anything about your data..."
            aria-label="Ask a question about your data"
            className="flex-1 bg-transparent py-3 text-sm outline-none text-slate-200 placeholder:text-slate-500"
          />
          {/* char counter when typing */}
          {query.length > 400 && (
            <span className="text-[10px] text-slate-500 shrink-0 mr-2">{query.length}/{MAX_QUERY_LENGTH}</span>
          )}
          {/* Help button */}
          <button
            onClick={() => setShowHelp(s => !s)}
            aria-label="Show example questions"
            title="What can I ask?"
            className={`shrink-0 ml-1 transition-colors ${showHelp ? 'text-primary' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <HelpCircle size={16} />
          </button>
        </div>
        <button onClick={() => handleSubmit()} aria-label="Send query" className="glow-btn rounded-xl px-5 flex items-center gap-2 text-sm font-medium text-white shrink-0">
          <Send size={14}/>Send
        </button>
      </motion.div>

      {/* Sample query chips */}
      {!chipsHidden && !recentQueries.length && hasData && !showHelp && (
        <div className="flex gap-2 flex-wrap mt-3">
          {SAMPLE_CHIPS.map((c, i) => (
            <button key={i} onClick={() => handleSubmit(`${c.emoji} ${c.text}`)}
              className="text-[11px] px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
              style={{
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.3)',
                color: '#a5b4fc'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
            >
              {c.emoji} {c.text}
            </button>
          ))}
        </div>
      )}

      {/* "What can I ask?" help panel */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-full left-0 right-0 mb-2 z-50 glass rounded-xl border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <p className="text-xs font-semibold text-slate-300">Example questions you can ask</p>
              <button onClick={() => setShowHelp(false)} aria-label="Close help panel" className="text-slate-500 hover:text-slate-300 transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {HELP_EXAMPLES.map(({ category, examples }) => (
                <div key={category}>
                  <p className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">{category}</p>
                  <div className="space-y-1">
                    {examples.map(ex => (
                      <button
                        key={ex}
                        onClick={() => { setQuery(ex); inputRef.current?.focus(); setShowHelp(false) }}
                        className="w-full text-left text-[11px] text-slate-400 hover:text-primary px-2 py-1.5 rounded-lg hover:bg-primary/10 transition-all"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
