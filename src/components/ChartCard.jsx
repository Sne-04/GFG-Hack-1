import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { useState } from 'react'

export default function ChartCard({ title, subtitle, reason, delay = 0, children }) {
  const [showReason, setShowReason] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.15, duration: 0.6 }}
      className="bg-[#101018] rounded-2xl p-5 transition-all duration-300 relative border border-white/5 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] group"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-bold text-slate-200 tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/80 group-hover:scale-150 transition-all"/> {title}
          </h3>
          {subtitle && <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p>}
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
              <div className="absolute right-0 top-7 z-50 glass rounded-lg p-3 text-[10px] text-slate-300 w-52 shadow-xl">
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
