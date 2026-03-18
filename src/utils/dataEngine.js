/**
 * DataEngine — Computes real aggregates from CSV data in JavaScript.
 * AI should use these pre-computed stats instead of guessing numbers.
 */

export function computeColumnStats(data, columns) {
  const stats = {}

  for (const col of columns) {
    const values = data.map(r => r[col]).filter(v => v != null)
    const numericValues = values.filter(v => typeof v === 'number' && !isNaN(v))

    if (numericValues.length > 0) {
      const sorted = [...numericValues].sort((a, b) => a - b)
      const sum = numericValues.reduce((a, b) => a + b, 0)
      const mean = sum / numericValues.length
      const variance = numericValues.reduce((acc, v) => acc + (v - mean) ** 2, 0) / numericValues.length
      const stdDev = Math.sqrt(variance)

      stats[col] = {
        type: 'number',
        count: numericValues.length,
        nullCount: data.length - numericValues.length,
        sum: round(sum),
        mean: round(mean),
        median: round(sorted[Math.floor(sorted.length / 2)]),
        min: sorted[0],
        max: sorted[sorted.length - 1],
        stdDev: round(stdDev)
      }
    } else {
      const unique = [...new Set(values.map(v => String(v).trim()).filter(Boolean))]
      const freq = {}
      for (const v of values) {
        const key = String(v).trim()
        if (key) freq[key] = (freq[key] || 0) + 1
      }
      const topN = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10)

      stats[col] = {
        type: 'string',
        count: values.length,
        nullCount: data.length - values.length,
        uniqueCount: unique.length,
        topValues: topN.map(([value, count]) => ({ value, count }))
      }
    }
  }

  return stats
}

export function computeGroupedAggregates(data, groupCol, valueCol, agg = 'sum') {
  const groups = {}
  for (const row of data) {
    const key = row[groupCol]
    if (key == null) continue
    const val = typeof row[valueCol] === 'number' ? row[valueCol] : 0
    if (!groups[key]) groups[key] = { sum: 0, count: 0, values: [] }
    groups[key].sum += val
    groups[key].count += 1
    groups[key].values.push(val)
  }

  return Object.entries(groups).map(([key, g]) => ({
    [groupCol]: key,
    [`${valueCol}_sum`]: round(g.sum),
    [`${valueCol}_avg`]: round(g.sum / g.count),
    [`${valueCol}_count`]: g.count,
    [`${valueCol}_min`]: Math.min(...g.values),
    [`${valueCol}_max`]: Math.max(...g.values)
  })).sort((a, b) => b[`${valueCol}_sum`] - a[`${valueCol}_sum`])
}

export function detectAnomalies(data, columns, stats) {
  const anomalies = []

  for (const col of columns) {
    const s = stats[col]
    if (!s) continue

    // Check for null/missing data
    if (s.nullCount > 0) {
      const pct = round((s.nullCount / data.length) * 100)
      if (pct > 5) anomalies.push(`${col}: ${pct}% missing values (${s.nullCount} of ${data.length})`)
    }

    if (s.type === 'number') {
      // Z-score outlier detection
      if (s.stdDev > 0) {
        let outlierCount = 0
        for (const row of data) {
          const v = row[col]
          if (typeof v === 'number' && Math.abs(v - s.mean) > 2.5 * s.stdDev) {
            outlierCount++
          }
        }
        if (outlierCount > 0) {
          anomalies.push(`${col}: ${outlierCount} outlier${outlierCount > 1 ? 's' : ''} detected (>2.5 std devs from mean ${s.mean})`)
        }
      }

      // Skewness check
      if (s.max > s.mean * 10 && s.min >= 0) {
        anomalies.push(`${col}: Highly skewed distribution (max ${s.max} is ${round(s.max / s.mean)}x the mean)`)
      }
    }

    if (s.type === 'string' && s.uniqueCount === 1) {
      anomalies.push(`${col}: Only 1 unique value — column may be irrelevant`)
    }
  }

  return anomalies.slice(0, 5)
}

export function computeTopN(data, column, n = 5) {
  const freq = {}
  for (const row of data) {
    const v = row[column]
    if (v != null) {
      const key = String(v)
      freq[key] = (freq[key] || 0) + 1
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([value, count]) => ({ value, count, pct: round((count / data.length) * 100) }))
}

export function buildPreComputedContext(data, columns, schema) {
  const stats = computeColumnStats(data, columns)
  const anomalies = detectAnomalies(data, columns, stats)

  // Find good grouping candidates (string cols with 2-15 unique values)
  const groupCols = columns.filter(c => stats[c]?.type === 'string' && stats[c].uniqueCount >= 2 && stats[c].uniqueCount <= 15)
  const numCols = columns.filter(c => stats[c]?.type === 'number')

  // Pre-compute top groupings (up to 3 group cols x top 2 numeric cols)
  const groupedData = {}
  for (const gc of groupCols.slice(0, 3)) {
    for (const nc of numCols.slice(0, 2)) {
      const key = `${gc}_by_${nc}`
      groupedData[key] = computeGroupedAggregates(data, gc, nc).slice(0, 15)
    }
  }

  return {
    stats,
    anomalies,
    groupedData,
    rowCount: data.length,
    columnCount: columns.length,
    schema
  }
}

function round(n) {
  return Math.round(n * 100) / 100
}
