import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function KPICard({ label, value, unit, trend, trendDirection, delay = 0 }) {
  const count = useMotionValue(0)
  const strVal = String(value ?? '')
  const parsed = parseFloat(strVal.replace(/[^0-9.-]/g, ''))
  const isNumeric = !isNaN(parsed) && strVal.replace(/[^0-9.-]/g, '').length > 0
  const numVal = isNumeric ? parsed : 0
  const display = useTransform(count, v => {
    if (unit === '$') return '$' + Math.round(v).toLocaleString()
    if (unit === '%') return Math.round(v) + '%'
    return Math.round(v).toLocaleString()
  })

  useEffect(() => {
    if (!isNumeric) return
    const ctrl = animate(count, numVal, { duration: 1.5, delay: delay * 0.15, ease: 'easeOut' })
    return ctrl.stop
  }, [numVal, isNumeric])

  const isUp = trendDirection === 'up'

  return (
    <motion.div
      role="region"
      aria-label={`${label}: ${typeof value === 'number' ? value.toLocaleString() : value}${unit ? ' ' + unit : ''}${trend ? ', ' + trend : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.15, duration: 0.5 }}
      className="relative overflow-hidden bg-gradient-to-br from-[#13141f] to-[#0c0d14] rounded-2xl p-4 sm:p-5 border border-white/10 shadow-lg group hover:border-primary/30 transition-all duration-500 cursor-default min-w-0"
    >
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-700" />

      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-3 relative z-10">{label}</p>
      
      <motion.p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 mb-2 relative z-10 tracking-tight truncate">
        {isNumeric ? display : strVal}
      </motion.p>
      
      {trend && (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold relative z-10 ${isUp ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {isUp ? <TrendingUp size={12}/> : <TrendingDown size={12}/>} 
          {trend}
        </div>
      )}
    </motion.div>
  )
}
