import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function KPICard({ label, value, unit, trend, trendDirection, delay = 0 }) {
  const count = useMotionValue(0)
  const numVal = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0
  const display = useTransform(count, v => {
    if (unit === '$') return '$' + Math.round(v).toLocaleString()
    if (unit === '%') return Math.round(v) + '%'
    return Math.round(v).toLocaleString()
  })

  useEffect(() => {
    const ctrl = animate(count, numVal, { duration: 1.5, delay: delay * 0.15, ease: 'easeOut' })
    return ctrl.stop
  }, [numVal])

  const isUp = trendDirection === 'up'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.15, duration: 0.5 }}
      className="glass rounded-xl p-4 text-center gradient-border glass-hover transition-all duration-300 cursor-default"
    >
      <motion.p className="text-2xl font-bold text-white mb-1">
        {display}
      </motion.p>
      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">{label}</p>
      {trend && (
        <div className={`flex items-center justify-center gap-1 mt-1 text-[10px] font-semibold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
          {isUp ? '↑' : '↓'} {trend}
        </div>
      )}
    </motion.div>
  )
}
