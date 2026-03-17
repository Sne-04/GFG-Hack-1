import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'
import { chatWithOpenAI } from '../utils/openaiApi'
import { motion } from 'framer-motion'

export default function AIChat({ context, apiKey }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "👋 Hi! I'm your AI data analyst. Ask me anything about this dashboard." }
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
      const reply = await chatWithOpenAI(userMsg, context, history, apiKey)
      setMessages(p => [...p, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages(p => [...p, { role: 'assistant', content: `Error: ${err.message || "I couldn't process that."}` }])
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={msgsRef} className="flex-1 overflow-y-auto space-y-2 p-1 mb-3">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}
          >
            {m.role === 'assistant' && <Bot size={14} className="text-primary mt-1 shrink-0"/>}
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
              m.role === 'user'
                ? 'bg-gradient-to-r from-primary to-primary-dark text-white rounded-br-sm'
                : 'glass text-slate-300 rounded-bl-sm'
            }`}>
              {m.content}
            </div>
            {m.role === 'user' && <User size={14} className="text-secondary mt-1 shrink-0"/>}
          </motion.div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <Bot size={14} className="text-primary mt-1"/>
            <div className="glass rounded-xl px-3 py-2 text-xs text-slate-400 italic animate-pulse">Thinking...</div>
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
