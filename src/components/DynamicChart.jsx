import { ResponsiveContainer, LineChart, BarChart, AreaChart, PieChart, ComposedChart, ScatterChart, FunnelChart, Funnel, RadialBarChart, RadialBar, Treemap, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Line, Bar, Area, Pie, Scatter, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ZAxis, LabelList } from 'recharts'
import { CustomTooltip, getChartColor } from '../utils/chartHelpers.jsx'

const COLORS = [
  "#6366f1",  // purple
  "#22d3ee",  // cyan  
  "#f59e0b",  // amber
  "#10b981",  // green
  "#f43f5e",  // red/pink
  "#8b5cf6",  // violet
  "#06b6d4",  // sky
]

// Heatmap color interpolation (dark → accent)
function heatColor(value, min, max) {
  if (max === min) return '#6366f1'
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)))
  // Dark blue → Indigo → Cyan gradient
  const r = Math.round(10 + ratio * 89)   // 10 → 99
  const g = Math.round(10 + ratio * 92)   // 10 → 102
  const b = Math.round(40 + ratio * 201)  // 40 → 241
  return `rgb(${r}, ${g}, ${b})`
}

const PRO_CHARTS = ['heatmap', 'scatter', 'funnel', 'gauge', 'treemap', 'waterfall', 'radar']

export default function DynamicChart({ type, data, xKey, yKeys, plan = 'free' }) {
  if (!data?.length || !yKeys?.length) return <p className="text-slate-500 text-xs text-center pt-20">No data</p>

  // Lock premium charts for free users
  if (plan === 'free' && PRO_CHARTS.includes(type)) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0f]/80 rounded-xl" />
        <div className="relative z-10 text-center px-4">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center mx-auto mb-3">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-primary">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-white mb-1">Pro Feature</p>
          <p className="text-[11px] text-slate-400 mb-3">{{ heatmap: 'Heatmap', scatter: 'Scatter', funnel: 'Funnel', gauge: 'Gauge', treemap: 'Treemap', waterfall: 'Waterfall', radar: 'Radar' }[type] || 'This'} chart requires a Pro plan</p>
          <a href="/pricing" className="inline-block px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/80 transition-colors">
            Upgrade to Pro →
          </a>
        </div>
      </div>
    )
  }

  const grid = <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
  const xA = <XAxis dataKey={xKey} stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
  const yA = <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
  const tt = <Tooltip content={<CustomTooltip />} />

  const renderLines = () => yKeys.map((yk, i) => (
    <Line key={yk.key} type="monotone" dataKey={yk.key} name={yk.name || yk.key} stroke={yk.color || getChartColor(i)} strokeWidth={2.5} dot={{ fill: yk.color || getChartColor(i), r: 3 }} activeDot={{ r: 6, fill: yk.color || getChartColor(i) }} />
  ))

  const renderBars = () => {
    if (yKeys.length === 1 && data && data.length > 0) {
      return (
        <Bar dataKey={yKeys[0].key} name={yKeys[0].name || yKeys[0].key} radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      )
    }
    return yKeys.map((yk, i) => (
      <Bar key={yk.key} dataKey={yk.key} name={yk.name || yk.key} 
        fill={yk.color || COLORS[i % COLORS.length]} 
        radius={[4, 4, 0, 0]} />
    ))
  }

  const renderAreas = () => yKeys.map((yk, i) => (
    <Area key={yk.key} type="monotone" dataKey={yk.key} name={yk.name || yk.key} stroke={yk.color || getChartColor(i)} fill={yk.color || getChartColor(i)} fillOpacity={0.15} strokeWidth={2} />
  ))

  // === FUNNEL ===
  if (type === 'funnel') {
    const dk = yKeys[0]?.key || 'value'
    const funnelData = data.map((d, i) => ({ ...d, fill: COLORS[i % COLORS.length] }))
    return (
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart>
          {tt}
          <Funnel dataKey={dk} data={funnelData} isAnimationActive>
            <LabelList position="right" fill="#94a3b8" stroke="none" fontSize={10} dataKey={xKey} />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    )
  }

  // === GAUGE (radial bar) ===
  if (type === 'gauge') {
    const dk = yKeys[0]?.key || 'value'
    const gaugeData = data.map((d, i) => ({ ...d, fill: COLORS[i % COLORS.length] }))
    return (
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={gaugeData} startAngle={180} endAngle={0}>
          <RadialBar minAngle={15} background clockWise dataKey={dk}>
            {gaugeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
          </RadialBar>
          {tt}
          <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} iconSize={8} />
        </RadialBarChart>
      </ResponsiveContainer>
    )
  }

  // === TREEMAP ===
  if (type === 'treemap') {
    const dk = yKeys[0]?.key || 'value'
    const treemapData = data.map((d, i) => ({ name: d[xKey], size: Number(d[dk]) || 0, fill: COLORS[i % COLORS.length] }))
    return (
      <ResponsiveContainer width="100%" height="100%">
        <Treemap data={treemapData} dataKey="size" aspectRatio={4 / 3} stroke="rgba(255,255,255,0.06)">
          {treemapData.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Treemap>
      </ResponsiveContainer>
    )
  }

  // === WATERFALL (cumulative bar with invisible spacer) ===
  if (type === 'waterfall') {
    const dk = yKeys[0]?.key || 'value'
    let cumulative = 0
    const waterfallData = data.map(d => {
      const val = Number(d[dk]) || 0
      const base = cumulative
      cumulative += val
      return { ...d, _base: base, _val: Math.abs(val), _pos: val >= 0 }
    })
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={waterfallData}>{grid}{xA}{yA}{tt}
          <Bar dataKey="_base" stackId="wf" fill="transparent" stroke="none" />
          <Bar dataKey="_val" stackId="wf" radius={[4, 4, 0, 0]}>
            {waterfallData.map((entry, i) => <Cell key={i} fill={entry._pos ? COLORS[0] : '#f43f5e'} />)}
          </Bar>
          <Legend wrapperStyle={{ fontSize: 10 }} payload={[{ value: 'Increase', type: 'rect', color: COLORS[0] }, { value: 'Decrease', type: 'rect', color: '#f43f5e' }]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  // === RADAR ===
  if (type === 'radar') {
    const dk = yKeys[0]?.key || 'value'
    return (
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.07)" />
          <PolarAngleAxis dataKey={xKey} tick={{ fill: '#64748b', fontSize: 10 }} />
          <PolarRadiusAxis tick={{ fill: '#475569', fontSize: 9 }} />
          {yKeys.map((yk, i) => (
            <Radar key={yk.key} name={yk.name || yk.key} dataKey={yk.key} stroke={yk.color || getChartColor(i)} fill={yk.color || getChartColor(i)} fillOpacity={0.2} />
          ))}
          {tt}
          <Legend wrapperStyle={{ fontSize: 10 }} />
        </RadarChart>
      </ResponsiveContainer>
    )
  }

  // === HEATMAP (custom CSS grid) ===
  if (type === 'heatmap') {
    const valueKey = yKeys[0]?.key || 'value'
    const allVals = data.map(d => Number(d[valueKey]) || 0)
    const minVal = Math.min(...allVals)
    const maxVal = Math.max(...allVals)

    // If there's a secondary grouping key, build a 2D grid
    const secondKey = yKeys.length > 1 ? yKeys[1]?.key : null

    if (secondKey) {
      // 2D heatmap: xKey = rows, secondKey = columns
      const xLabels = [...new Set(data.map(d => d[xKey]))]
      const yLabels = [...new Set(data.map(d => d[secondKey]))]
      
      return (
        <div className="w-full h-full overflow-auto px-2 py-1">
          <div className="flex gap-1 mb-1">
            <div className="w-16 shrink-0" />
            {yLabels.map(yl => (
              <div key={yl} className="flex-1 text-center text-[8px] text-slate-500 truncate px-0.5">{yl}</div>
            ))}
          </div>
          {xLabels.map(xl => (
            <div key={xl} className="flex gap-1 mb-1">
              <div className="w-16 shrink-0 text-[9px] text-slate-400 truncate flex items-center">{xl}</div>
              {yLabels.map(yl => {
                const cell = data.find(d => d[xKey] === xl && d[secondKey] === yl)
                const val = cell ? Number(cell[valueKey]) || 0 : 0
                return (
                  <div
                    key={yl}
                    className="flex-1 rounded-sm flex items-center justify-center min-h-[28px] text-[9px] font-medium text-white/90 transition-all hover:scale-105 hover:ring-1 hover:ring-white/20 cursor-default"
                    style={{ background: heatColor(val, minVal, maxVal) }}
                    title={`${xl} × ${yl}: ${val}`}
                  >
                    {val ? (val >= 1000 ? `${(val/1000).toFixed(1)}k` : val) : '–'}
                  </div>
                )
              })}
            </div>
          ))}
          <div className="flex items-center justify-center mt-2 gap-1">
            <span className="text-[8px] text-slate-500">{minVal}</span>
            <div className="h-2 w-24 rounded-full" style={{ background: `linear-gradient(to right, ${heatColor(minVal, minVal, maxVal)}, ${heatColor(maxVal, minVal, maxVal)})` }} />
            <span className="text-[8px] text-slate-500">{maxVal}</span>
          </div>
        </div>
      )
    }

    // 1D heatmap: simple horizontal color-coded bar chart
    return (
      <div className="w-full h-full overflow-auto flex flex-col justify-center gap-1.5 px-3 py-2">
        {data.map((d, i) => {
          const val = Number(d[valueKey]) || 0
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[9px] text-slate-400 w-20 truncate shrink-0 text-right">{d[xKey]}</span>
              <div className="flex-1 h-6 rounded-md flex items-center px-2 relative overflow-hidden transition-all hover:ring-1 hover:ring-white/20"
                style={{ background: heatColor(val, minVal, maxVal) }}>
                <span className="text-[9px] text-white/90 font-medium relative z-10">
                  {val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
                </span>
              </div>
            </div>
          )
        })}
        <div className="flex items-center justify-center mt-1 gap-1">
          <span className="text-[8px] text-slate-500">Low</span>
          <div className="h-2 w-20 rounded-full" style={{ background: `linear-gradient(to right, ${heatColor(minVal, minVal, maxVal)}, ${heatColor(maxVal, minVal, maxVal)})` }} />
          <span className="text-[8px] text-slate-500">High</span>
        </div>
      </div>
    )
  }

  // === SCATTER ===
  if (type === 'scatter') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>{grid}{xA}{yA}{tt}
          <ZAxis range={[40, 400]} />
          {yKeys.map((yk, i) => (
            <Scatter key={yk.key} dataKey={yk.key} name={yk.name || yk.key} fill={yk.color || getChartColor(i)} />
          ))}
          <Legend wrapperStyle={{ fontSize: 10 }} />
        </ScatterChart>
      </ResponsiveContainer>
    )
  }

  // === PIE / DONUT ===
  if (type === 'pie' || type === 'donut') {
    const dk = yKeys[0]?.key || 'value'
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey={dk} nameKey={xKey} cx="50%" cy="50%" innerRadius={type === 'donut' ? 55 : 0} outerRadius={90} paddingAngle={2} stroke="rgba(255,255,255,0.05)">
            {data.map((_, i) => <Cell key={i} fill={getChartColor(i)} />)}
          </Pie>
          {tt}
          <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  // === COMPOSED ===
  if (type === 'composed') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>{grid}{xA}{yA}{tt}
          {yKeys.map((yk, i) => i === 0
            ? <Bar key={yk.key} dataKey={yk.key} name={yk.name || yk.key} fill={yk.color || getChartColor(i)} radius={[4, 4, 0, 0]} />
            : <Line key={yk.key} type="monotone" dataKey={yk.key} name={yk.name || yk.key} stroke={yk.color || getChartColor(i)} strokeWidth={2} dot={{ r: 3 }} />
          )}
          <Legend wrapperStyle={{ fontSize: 10 }} />
        </ComposedChart>
      </ResponsiveContainer>
    )
  }

  // === AREA ===
  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>{grid}{xA}{yA}{tt}{renderAreas()}<Legend wrapperStyle={{ fontSize: 10 }} /></AreaChart>
      </ResponsiveContainer>
    )
  }

  // === BAR ===
  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>{grid}{xA}{yA}{tt}{renderBars()}<Legend wrapperStyle={{ fontSize: 10 }} /></BarChart>
      </ResponsiveContainer>
    )
  }

  // === DEFAULT: LINE ===
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>{grid}{xA}{yA}{tt}{renderLines()}<Legend wrapperStyle={{ fontSize: 10 }} /></LineChart>
    </ResponsiveContainer>
  )
}
