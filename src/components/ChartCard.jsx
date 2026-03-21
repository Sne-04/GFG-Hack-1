import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { useState } from 'react'

export default function ChartCard({ title, subtitle, reason, delay = 0, children, darkMode = true }) {
  const [showReason, setShowReason] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.15, duration: 0.6 }}
      className={`rounded-2xl p-5 transition-all duration-300 relative border group ${
        darkMode
          ? 'bg-[#101018] border-white/5 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]'
          : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-primary/20'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className={`text-[14px] font-bold tracking-tight flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-primary/80 group-hover:scale-150 transition-all"/> {title}
          </h3>
          {subtitle && <p className={`text-[11px] mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{subtitle}</p>}
        </div>
        {reason && (
          <div className="relative">
            <button
              onMouseEnter={() => setShowReason(true)}
              onMouseLeave={() => setShowReason(false)}
              className="text-slate-500 hover:text-primary transition-colors p-1"
            >
              <Info size={14}/>
            </button>
            {showReason && (
              <div className={`absolute right-0 top-7 z-50 glass rounded-lg p-3 text-[10px] w-52 shadow-xl ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {reason}
              </div>
            )}
          </div>
        )}
      </div>
      {children}
    </motion.div>
  )
}
