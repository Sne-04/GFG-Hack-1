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
      className="glass rounded-xl p-5 transition-all duration-300 relative hover:shadow-[0_0_25px_rgba(99,102,241,0.35)]"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          {subtitle && <p className="text-[10px] text-slate-500">{subtitle}</p>}
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
