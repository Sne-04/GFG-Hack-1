import { useState, useEffect, useRef } from 'react'

const InsightBanner = ({ insight, anomalies }) => {
  const [displayed, setDisplayed] = useState('')
  const rafRef = useRef(null)

  useEffect(() => {
    if (!insight) return
    setDisplayed('')
    let i = 0
    let last = 0
    const step = (timestamp) => {
      if (timestamp - last >= 20) {
        i++
        setDisplayed(insight.slice(0, i))
        last = timestamp
      }
      if (i <= insight.length) {
        rafRef.current = requestAnimationFrame(step)
      }
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [insight])

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 to-transparent rounded-2xl p-6 mt-6 border border-primary/20 hover:border-primary/40 transition-all">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      {anomalies?.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-3">
          {anomalies.map((a, i) => (
            <span key={i} className="bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"/> {a}
            </span>
          ))}
        </div>
      )}
      <div className="text-primary font-bold mb-2 text-[13px] flex items-center gap-2 uppercase tracking-wider">
        <span className="bg-primary/20 p-1.5 rounded-md text-[14px]">🤖</span> AI Insight
      </div>
      <div className="text-slate-300 leading-relaxed text-[14px] font-medium">
        {displayed}
        {displayed.length < (insight?.length || 0) && (
          <span className="animate-pulse text-primary ml-1 text-lg">|</span>
        )}
      </div>
    </div>
  )
}

export default InsightBanner
