import { ResponsiveContainer, LineChart, BarChart, AreaChart, PieChart, ComposedChart, Line, Bar, Area, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
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

export default function DynamicChart({ type, data, xKey, yKeys }) {
  if (!data?.length || !yKeys?.length) return <p className="text-slate-500 text-xs text-center pt-20">No data</p>

  const grid = <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
  const xA = <XAxis dataKey={xKey} stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
  const yA = <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
  const tt = <Tooltip content={<CustomTooltip />} />

  const renderLines = () => yKeys.map((yk, i) => (
    <Line key={yk.key} type="monotone" dataKey={yk.key} name={yk.name || yk.key} stroke={yk.color || getChartColor(i)} strokeWidth={2.5} dot={{ fill: yk.color || getChartColor(i), r: 3 }} activeDot={{ r: 6, fill: yk.color || getChartColor(i) }} />
  ))

  const renderBars = () => {
    // For single-metric bar charts where all bars should show different colors per data point
    if (yKeys.length === 1 && data && data.length > 0) {
      return (
        <Bar dataKey={yKeys[0].key} name={yKeys[0].name || yKeys[0].key} radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      )
    }
    
    // For multi-metric bar charts where each bar series gets a different color
    return yKeys.map((yk, i) => (
      <Bar key={yk.key} dataKey={yk.key} name={yk.name || yk.key} 
        fill={yk.color || COLORS[i % COLORS.length]} 
        radius={[4, 4, 0, 0]} />
    ))
  }

  const renderAreas = () => yKeys.map((yk, i) => (
    <Area key={yk.key} type="monotone" dataKey={yk.key} name={yk.name || yk.key} stroke={yk.color || getChartColor(i)} fill={yk.color || getChartColor(i)} fillOpacity={0.15} strokeWidth={2} />
  ))

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

  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>{grid}{xA}{yA}{tt}{renderAreas()}<Legend wrapperStyle={{ fontSize: 10 }} /></AreaChart>
      </ResponsiveContainer>
    )
  }

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>{grid}{xA}{yA}{tt}{renderBars()}<Legend wrapperStyle={{ fontSize: 10 }} /></BarChart>
      </ResponsiveContainer>
    )
  }

  // default: line
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>{grid}{xA}{yA}{tt}{renderLines()}<Legend wrapperStyle={{ fontSize: 10 }} /></LineChart>
    </ResponsiveContainer>
  )
}
