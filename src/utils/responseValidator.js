/**
 * ResponseValidator — Validates AI responses against real computed data.
 * Ensures KPIs use real numbers, charts reference real columns, etc.
 */

export function validateAndFixResponse(response, preComputed, columns) {
  if (!response || response.cannot_answer) return response

  const fixed = { ...response }

  // Fix KPIs — replace hallucinated values with real computed stats
  if (fixed.kpis?.length) {
    fixed.kpis = fixed.kpis.map(kpi => fixKPI(kpi, preComputed.stats))
  }

  // Fix charts — ensure xKey and yKeys reference real columns
  if (fixed.charts?.length) {
    fixed.charts = fixed.charts
      .map(chart => fixChart(chart, columns, preComputed.stats))
      .filter(Boolean)
  }

  // Fix anomalies — merge with real detected anomalies
  if (preComputed.anomalies?.length) {
    const aiAnomalies = fixed.anomalies || []
    const realAnomalies = preComputed.anomalies
    // Prefer real anomalies, append unique AI ones
    const combined = [...realAnomalies]
    for (const a of aiAnomalies) {
      if (!combined.some(r => r.toLowerCase().includes(a.toLowerCase().slice(0, 20)))) {
        combined.push(a)
      }
    }
    fixed.anomalies = combined.slice(0, 5)
  }

  return fixed
}

function fixKPI(kpi, stats) {
  if (!kpi || typeof kpi.value === 'undefined') return kpi

  // Try to match KPI label to a column's computed stat
  const label = (kpi.label || '').toLowerCase()
  for (const [col, s] of Object.entries(stats)) {
    if (s.type !== 'number') continue
    const colLower = col.toLowerCase()

    // Match common KPI patterns to computed stats
    if (label.includes('total') && label.includes(colLower)) {
      return { ...kpi, value: s.sum }
    }
    if (label.includes('average') && label.includes(colLower)) {
      return { ...kpi, value: s.mean }
    }
    if ((label.includes('max') || label.includes('highest')) && label.includes(colLower)) {
      return { ...kpi, value: s.max }
    }
    if ((label.includes('min') || label.includes('lowest')) && label.includes(colLower)) {
      return { ...kpi, value: s.min }
    }
    if (label.includes('count') && label.includes(colLower)) {
      return { ...kpi, value: s.count }
    }
  }

  // If label mentions "total rows" or "records"
  if (label.includes('total') && (label.includes('row') || label.includes('record') || label.includes('count'))) {
    const firstNumCol = Object.values(stats).find(s => s.type === 'number')
    if (firstNumCol) return { ...kpi, value: firstNumCol.count }
  }

  return kpi
}

function fixChart(chart, columns, stats) {
  if (!chart) return null

  const fixed = { ...chart }

  // Validate xKey exists in columns
  if (fixed.xKey && !columns.includes(fixed.xKey)) {
    // Try case-insensitive match
    const match = columns.find(c => c.toLowerCase() === fixed.xKey.toLowerCase())
    if (match) {
      fixed.xKey = match
    } else {
      // Pick best candidate: first string column for categories, or first column
      const stringCol = Object.entries(stats).find(([, s]) => s.type === 'string')
      fixed.xKey = stringCol ? stringCol[0] : columns[0]
    }
  }

  // Validate yKeys reference real columns
  if (fixed.yKeys?.length) {
    fixed.yKeys = fixed.yKeys.map(yk => {
      if (!yk.key) return yk
      if (columns.includes(yk.key)) return yk
      // Try case-insensitive match
      const match = columns.find(c => c.toLowerCase() === yk.key.toLowerCase())
      if (match) return { ...yk, key: match }
      // If key doesn't exist but data has the values, keep it (AI-computed aggregation key)
      if (fixed.data?.length && fixed.data[0]?.[yk.key] !== undefined) return yk
      return yk
    })
  }

  // Ensure chart data is an array with at least one entry
  if (!Array.isArray(fixed.data) || fixed.data.length === 0) {
    return null // Remove charts with no data
  }

  // Cap data points at 20
  if (fixed.data.length > 20) {
    fixed.data = fixed.data.slice(0, 20)
  }

  return fixed
}

export function validateColumns(response, columns) {
  const issues = []

  if (response.charts) {
    for (const chart of response.charts) {
      if (chart.xKey && !columns.includes(chart.xKey)) {
        issues.push(`Chart "${chart.title}": xKey "${chart.xKey}" not in columns`)
      }
      for (const yk of (chart.yKeys || [])) {
        if (yk.key && !columns.includes(yk.key) && !(chart.data?.[0]?.[yk.key] !== undefined)) {
          issues.push(`Chart "${chart.title}": yKey "${yk.key}" not in columns`)
        }
      }
    }
  }

  return issues
}
