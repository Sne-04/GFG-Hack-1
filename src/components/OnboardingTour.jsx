import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, MessageSquare, BarChart2, X, ArrowRight, ChevronRight } from 'lucide-react'

const STEPS = [
  {
    icon: Upload,
    color: 'from-primary/20 to-primary/5',
    iconColor: 'text-primary',
    title: 'Upload your data',
    description: 'Drag & drop any CSV file — a spreadsheet export, sales report, or customer list. DataMind supports files up to 10MB on the free plan.',
    tip: 'No CSV? Click "Try with demo playground" to explore with sample data.',
  },
  {
    icon: MessageSquare,
    color: 'from-secondary/20 to-secondary/5',
    iconColor: 'text-secondary',
    title: 'Ask a question in plain English',
    description: 'No SQL or coding needed. Just type what you want to know — "Show monthly revenue trend" or "Which product sells best?"',
    tip: 'Click the ? button next to the search bar for 10+ example questions.',
  },
  {
    icon: BarChart2,
    color: 'from-emerald-500/20 to-emerald-500/5',
    iconColor: 'text-emerald-400',
    title: 'Explore your results',
    description: 'Your data becomes interactive charts, KPI cards, and AI insights instantly. Filter, compare, and export your findings.',
    tip: 'Use the AI Chat panel on the right to dig deeper with follow-up questions.',
  },
]

export default function OnboardingTour() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem('datamind-tour-seen')) {
      // Small delay so the page renders first
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem('datamind-tour-seen', '1')
    setVisible(false)
  }

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      dismiss()
    }
  }

  const current = STEPS[step]
  const Icon = current.icon

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-[#0e0e18] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">
              {/* Top gradient strip */}
              <div className={`h-1 w-full bg-gradient-to-r ${current.color.replace('/20', '').replace('/5', '/60')}`} />

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${current.color} flex items-center justify-center`}>
                    <Icon size={22} className={current.iconColor} />
                  </div>
                  <button onClick={dismiss} aria-label="Close tour" className="text-slate-500 hover:text-slate-300 transition-colors p-1">
                    <X size={16} />
                  </button>
                </div>

                {/* Content */}
                <h2 className="text-lg font-bold text-white mb-2">{current.title}</h2>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">{current.description}</p>

                {/* Tip */}
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex gap-2">
                  <ChevronRight size={14} className="text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400">{current.tip}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-5 flex items-center justify-between">
                {/* Step dots */}
                <div className="flex gap-1.5">
                  {STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(i)}
                      aria-label={`Go to step ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-5 bg-primary' : 'w-1.5 bg-white/20 hover:bg-white/40'}`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <button onClick={dismiss} className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-2">
                    Skip
                  </button>
                  <button onClick={next} className="glow-btn rounded-lg px-4 py-2 text-xs font-semibold text-white flex items-center gap-1.5">
                    {step === STEPS.length - 1 ? "Let's go!" : 'Next'}
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
