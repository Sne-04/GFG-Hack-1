import { motion } from 'framer-motion'
import { Search, Bot, BarChart3, CheckCircle2, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

const STEPS = [
  { icon: Search, text: 'Analyzing your data schema...' },
  { icon: Bot, text: 'Generating insights with AI...' },
  { icon: BarChart3, text: 'Rendering your dashboard...' }
]

export default function LoadingSteps() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setActive(1), 800)
    const t2 = setTimeout(() => setActive(2), 1600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      {STEPS.map((s, i) => {
        const Icon = s.icon
        const done = i < active
        const current = i === active
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.4, duration: 0.4 }}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 ${done ? 'glass border-emerald-500/20' : current ? 'glass border-primary/30 animate-glow' : 'opacity-30'}`}
          >
            {done ? <CheckCircle2 size={18} className="text-emerald-400"/> : current ? <Loader2 size={18} className="text-primary animate-spin"/> : <Icon size={18} className="text-slate-500"/>}
            <span className={`text-sm ${done ? 'text-emerald-400' : current ? 'text-slate-200' : 'text-slate-500'}`}>{s.text}</span>
          </motion.div>
        )
      })}
    </div>
  )
}
