import { describe, it, expect } from 'vitest'
import { validateAndFixResponse, validateColumns } from '../responseValidator'

const COLUMNS = ['region', 'product', 'sales', 'revenue']
const PRE_COMPUTED = {
  stats: {
    sales: { type: 'number', sum: 830, mean: 166, max: 300, min: 80, count: 5, stdDev: 75 },
    revenue: { type: 'number', sum: 3420, mean: 684, max: 1200, min: 320, count: 5, stdDev: 300 },
    region: { type: 'string', uniqueCount: 3, topValues: [] },
    product: { type: 'string', uniqueCount: 2, topValues: [] },
  },
  anomalies: ['sales: 1 outlier detected'],
}

describe('validateAndFixResponse', () => {
  it('returns response unchanged when no kpis/charts', () => {
    const res = { summary: 'nice data', kpis: [], charts: [] }
    const fixed = validateAndFixResponse(res, PRE_COMPUTED, COLUMNS)
    expect(fixed.summary).toBe('nice data')
  })

  it('returns null/undefined response as-is', () => {
    expect(validateAndFixResponse(null, PRE_COMPUTED, COLUMNS)).toBeNull()
    expect(validateAndFixResponse(undefined, PRE_COMPUTED, COLUMNS)).toBeUndefined()
  })

  it('returns cannot_answer responses unchanged', () => {
    const res = { cannot_answer: true, message: 'No data' }
    const fixed = validateAndFixResponse(res, PRE_COMPUTED, COLUMNS)
    expect(fixed.cannot_answer).toBe(true)
  })

  it('fixes KPI total sales to use computed sum', () => {
    const res = {
      kpis: [{ label: 'Total Sales', value: 9999, format: 'number' }],
      charts: [],
    }
    const fixed = validateAndFixResponse(res, PRE_COMPUTED, COLUMNS)
    expect(fixed.kpis[0].value).toBe(830) // from stats.sales.sum
  })

  it('fixes KPI average revenue to use computed mean', () => {
    const res = {
      kpis: [{ label: 'Average Revenue', value: 99999 }],
      charts: [],
    }
    const fixed = validateAndFixResponse(res, PRE_COMPUTED, COLUMNS)
    expect(fixed.kpis[0].value).toBe(684)
  })

  it('fixes KPI max sales to use computed max', () => {
    const res = {
      kpis: [{ label: 'Max Sales', value: 1 }],
      charts: [],
    }
    const fixed = validateAndFixResponse(res, PRE_COMPUTED, COLUMNS)
    expect(fixed.kpis[0].value).toBe(300)
  })

  it('removes charts with empty data array', () => {
    const res = {
      kpis: [],
      charts: [{ title: 'Bad', xKey: 'region', yKeys: [{ key: 'sales' }], data: [] }],
    }
    const fixed = validateAndFixResponse(res, PRE_COMPUTED, COLUMNS)
    expect(fixed.charts).toHaveLength(0)
  })

  it('keeps charts with valid data', () => {
    const res = {
      kpis: [],
      charts: [{
        title: 'Sales by Region',
        type: 'bar',
        xKey: 'region',
        yKeys: [{ key: 'sales' }],
        data: [{ region: 'North', sales: 300 }]
      }],
    }
    const fixed = validateAndFixResponse(res, PRE_COMPUTED, COLUMNS)
    expect(fixed.charts).toHaveLength(1)
  })

  it('fixes xKey case mismatch', () => {
    const res = {
      kpis: [],
      charts: [{
        title: 'Test',
        type: 'bar',
        xKey: 'Region', // wrong case
        yKeys: [{ key: 'sales' }],
        data: [{ Region: 'North', sales: 300 }]
      }],
    }
    const fixed = validateAndFixResponse(res, PRE_COMPUTED, COLUMNS)
    expect(fixed.charts[0].xKey).toBe('region')
  })

  it('caps chart data at 20 points', () => {
    const bigData = Array.from({ length: 30 }, (_, i) => ({ region: `r${i}`, sales: i * 10 }))
    const res = {
      kpis: [],
      charts: [{
        title: 'Big Chart',
        type: 'bar',
        xKey: 'region',
        yKeys: [{ key: 'sales' }],
        data: bigData,
      }],
    }
    const fixed = validateAndFixResponse(res, PRE_COMPUTED, COLUMNS)
    expect(fixed.charts[0].data.length).toBe(20)
  })

  it('merges real anomalies into response', () => {
    const res = { kpis: [], charts: [], anomalies: ['some AI anomaly'] }
    const fixed = validateAndFixResponse(res, PRE_COMPUTED, COLUMNS)
    expect(fixed.anomalies).toContain('sales: 1 outlier detected')
  })
})

describe('validateColumns', () => {
  it('returns no issues for valid chart columns', () => {
    const response = {
      charts: [{
        title: 'Valid Chart',
        xKey: 'region',
        yKeys: [{ key: 'sales' }],
        data: [{ region: 'North', sales: 100 }],
      }],
    }
    const issues = validateColumns(response, COLUMNS)
    expect(issues).toHaveLength(0)
  })

  it('reports invalid xKey', () => {
    const response = {
      charts: [{
        title: 'Bad xKey',
        xKey: 'nonexistent',
        yKeys: [{ key: 'sales' }],
        data: [],
      }],
    }
    const issues = validateColumns(response, COLUMNS)
    expect(issues.length).toBeGreaterThan(0)
    expect(issues[0]).toContain('nonexistent')
  })

  it('reports invalid yKey', () => {
    const response = {
      charts: [{
        title: 'Bad yKey',
        xKey: 'region',
        yKeys: [{ key: 'fakeColumn' }],
        data: [],
      }],
    }
    const issues = validateColumns(response, COLUMNS)
    expect(issues.some(i => i.includes('fakeColumn'))).toBe(true)
  })

  it('returns empty array when no charts', () => {
    const issues = validateColumns({ charts: [] }, COLUMNS)
    expect(issues).toHaveLength(0)
  })
})
