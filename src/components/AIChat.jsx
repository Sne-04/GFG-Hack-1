import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'
import { chatWithOpenAI } from '../utils/openaiApi'
import { motion } from 'framer-motion'

export default function AIChat({ context }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "📊 Hi! I'm your DataMind AI analyst. I can only answer questions about your uploaded dataset. Ask me about trends, metrics, or insights from your data!" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const msgsRef = useRef(null)

  useEffect(() => {
    msgsRef.current?.scrollTo(0, msgsRef.current.scrollHeight)
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(p => [...p, { role: 'user', content: userMsg }])
    setLoading(true)
    try {
      const history = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))
      const reply = await chatWithOpenAI(userMsg, context, history)
      setMessages(p => [...p, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages(p => [...p, { role: 'assistant', content: `Error: ${err.message || "I couldn't process that."}` }])
    }
    setLoading(false)
  }

  const SUGGESTIONS = [
    "What are the key trends in my data?",
    "Which metric needs attention?",
    "Summarize the dataset"
  ]

  return (
    <div className="flex flex-col h-full">
      <div ref={msgsRef} className="flex-1 overflow-y-auto space-y-3 p-2 mb-3">
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {SUGGESTIONS.map(s => (
              <button 
                key={s} 
                onClick={() => { setInput(s); setTimeout(() => send(), 50) }}
                className="glass text-[10px] text-primary/80 hover:text-primary px-3 py-1.5 rounded-full whitespace-nowrap"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}
          >
            {m.role === 'assistant' && <Bot size={14} className="text-primary mt-1 shrink-0"/>}
            <div style={
              m.role === 'user'
                ? {
                    background: 'rgba(99,102,241,0.2)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: '12px 12px 0 12px',
                    padding: '10px 14px',
                    color: '#f1f5f9'
                  }
                : {
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px 12px 12px 0',
                    padding: '10px 14px',
                    color: '#e2e8f0'
                  }
            } className="text-xs leading-relaxed max-w-[85%]">
              {m.content}
            </div>
            {m.role === 'user' && <User size={14} className="text-secondary mt-1 shrink-0"/>}
          </motion.div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <Bot size={14} className="text-primary mt-1"/>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px 12px 12px 0',
              padding: '10px 14px',
              color: '#e2e8f0'
            }} className="text-xs italic flex items-center gap-1">
              Thinking <span className="animate-pulse">● ● ●</span>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2 border-t border-white/5 pt-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about this data..."
          className="flex-1 glass rounded-lg px-3 py-2 text-xs bg-transparent outline-none text-slate-200 focus:ring-1 focus:ring-primary/30"
        />
        <button onClick={send} className="glow-btn rounded-lg px-3 py-2">
          <Send size={12}/>
        </button>
      </div>
    </div>
  )
}
