const CHART_COLORS = ['#6366f1','#22d3ee','#f59e0b','#10b981','#f43f5e','#8b5cf6','#ec4899']

export const getChartColor = (i) => CHART_COLORS[i % CHART_COLORS.length]

export const formatNumber = (n) => {
  if (n == null) return '0'
  if (typeof n === 'string') return n
  if (n >= 1e6) return (n/1e6).toFixed(1)+'M'
  if (n >= 1e3) return (n/1e3).toFixed(1)+'K'
  return n.toLocaleString()
}

export const formatCurrency = (n) => {
  if (n == null) return '$0'
  if (typeof n === 'string') return n
  if (n >= 1e6) return '$'+(n/1e6).toFixed(1)+'M'
  if (n >= 1e3) return '$'+(n/1e3).toFixed(1)+'K'
  return '$'+n.toLocaleString()
}

export const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  )
}
