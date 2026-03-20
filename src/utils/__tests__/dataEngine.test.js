import { describe, it, expect } from 'vitest'
import {
  computeColumnStats,
  computeGroupedAggregates,
  detectAnomalies,
  computeTopN,
  buildPreComputedContext,
} from '../dataEngine'

const SALES_DATA = [
  { region: 'North', product: 'Apple', sales: 100, revenue: 500 },
  { region: 'North', product: 'Banana', sales: 200, revenue: 800 },
  { region: 'South', product: 'Apple', sales: 150, revenue: 600 },
  { region: 'South', product: 'Banana', sales: 80, revenue: 320 },
  { region: 'East', product: 'Apple', sales: 300, revenue: 1200 },
]
const COLUMNS = ['region', 'product', 'sales', 'revenue']

describe('computeColumnStats', () => {
  it('computes correct sum for numeric column', () => {
    const stats = computeColumnStats(SALES_DATA, ['sales'])
    expect(stats.sales.sum).toBe(830)
  })

  it('computes correct mean', () => {
    const stats = computeColumnStats(SALES_DATA, ['sales'])
    expect(stats.sales.mean).toBe(166)
  })

  it('computes min and max', () => {
    const stats = computeColumnStats(SALES_DATA, ['sales'])
    expect(stats.sales.min).toBe(80)
    expect(stats.sales.max).toBe(300)
  })

  it('computes median', () => {
    const stats = computeColumnStats(SALES_DATA, ['sales'])
    // sorted: [80, 100, 150, 200, 300] — median is index 2 = 150
    expect(stats.sales.median).toBe(150)
  })

  it('marks numeric columns as type "number"', () => {
    const stats = computeColumnStats(SALES_DATA, COLUMNS)
    expect(stats.sales.type).toBe('number')
    expect(stats.revenue.type).toBe('number')
  })

  it('marks string columns as type "string"', () => {
    const stats = computeColumnStats(SALES_DATA, COLUMNS)
    expect(stats.region.type).toBe('string')
    expect(stats.product.type).toBe('string')
  })

  it('computes topValues for string columns', () => {
    const stats = computeColumnStats(SALES_DATA, ['product'])
    const appleEntry = stats.product.topValues.find(t => t.value === 'Apple')
    expect(appleEntry).toBeTruthy()
    expect(appleEntry.count).toBe(3)
  })

  it('counts nulls correctly', () => {
    const dataWithNull = [...SALES_DATA, { region: null, product: null, sales: null, revenue: null }]
    const stats = computeColumnStats(dataWithNull, ['sales'])
    expect(stats.sales.nullCount).toBe(1)
  })

  it('computes stdDev > 0 for varying data', () => {
    const stats = computeColumnStats(SALES_DATA, ['sales'])
    expect(stats.sales.stdDev).toBeGreaterThan(0)
  })
})

describe('computeGroupedAggregates', () => {
  it('groups by region and sums sales', () => {
    const result = computeGroupedAggregates(SALES_DATA, 'region', 'sales')
    const north = result.find(r => r.region === 'North')
    expect(north.sales_sum).toBe(300) // 100 + 200
  })

  it('computes average per group', () => {
    const result = computeGroupedAggregates(SALES_DATA, 'region', 'sales')
    const north = result.find(r => r.region === 'North')
    expect(north.sales_avg).toBe(150)
  })

  it('sorts descending by sum', () => {
    const result = computeGroupedAggregates(SALES_DATA, 'region', 'sales')
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].sales_sum).toBeGreaterThanOrEqual(result[i].sales_sum)
    }
  })

  it('includes min and max per group', () => {
    const result = computeGroupedAggregates(SALES_DATA, 'region', 'sales')
    const north = result.find(r => r.region === 'North')
    expect(north.sales_min).toBe(100)
    expect(north.sales_max).toBe(200)
  })

  it('skips rows with null group key', () => {
    const dataWithNull = [...SALES_DATA, { region: null, sales: 9999 }]
    const result = computeGroupedAggregates(dataWithNull, 'region', 'sales')
    expect(result.every(r => r.region !== null)).toBe(true)
  })
})

describe('detectAnomalies', () => {
  it('detects outliers via z-score', () => {
    // 9 clustered values + 1 extreme outlier — outlier must be >2.5σ from mean
    const data = Array.from({ length: 9 }, () => ({ val: 10 }))
    data.push({ val: 1000 }) // z-score ≈ 3 → outlier
    const stats = computeColumnStats(data, ['val'])
    const anomalies = detectAnomalies(data, ['val'], stats)
    expect(anomalies.some(a => a.includes('outlier'))).toBe(true)
  })

  it('detects high null rate', () => {
    const data = Array.from({ length: 20 }, (_, i) => ({
      x: i < 2 ? i : null,
    }))
    const stats = computeColumnStats(data, ['x'])
    const anomalies = detectAnomalies(data, ['x'], stats)
    expect(anomalies.some(a => a.includes('missing'))).toBe(true)
  })

  it('detects columns with only 1 unique value', () => {
    const data = [{ tag: 'same' }, { tag: 'same' }, { tag: 'same' }]
    const stats = computeColumnStats(data, ['tag'])
    const anomalies = detectAnomalies(data, ['tag'], stats)
    expect(anomalies.some(a => a.includes('1 unique'))).toBe(true)
  })

  it('returns at most 5 anomalies', () => {
    const stats = computeColumnStats(SALES_DATA, COLUMNS)
    const anomalies = detectAnomalies(SALES_DATA, COLUMNS, stats)
    expect(anomalies.length).toBeLessThanOrEqual(5)
  })
})

describe('computeTopN', () => {
  it('returns top N most frequent values', () => {
    const top = computeTopN(SALES_DATA, 'product', 2)
    expect(top).toHaveLength(2)
    expect(top[0].value).toBe('Apple') // 3 occurrences
    expect(top[0].count).toBe(3)
  })

  it('calculates percentage', () => {
    const top = computeTopN(SALES_DATA, 'product', 5)
    const apple = top.find(t => t.value === 'Apple')
    expect(apple.pct).toBe(60) // 3/5 = 60%
  })

  it('handles n larger than unique values', () => {
    const top = computeTopN(SALES_DATA, 'product', 100)
    expect(top.length).toBeLessThanOrEqual(2) // only Apple and Banana
  })
})

describe('buildPreComputedContext', () => {
  const schema = [
    { name: 'region', type: 'string' },
    { name: 'sales', type: 'number' },
  ]

  it('returns stats for all columns', () => {
    const ctx = buildPreComputedContext(SALES_DATA, COLUMNS, schema)
    expect(ctx.stats).toHaveProperty('sales')
    expect(ctx.stats).toHaveProperty('region')
  })

  it('returns rowCount and columnCount', () => {
    const ctx = buildPreComputedContext(SALES_DATA, COLUMNS, schema)
    expect(ctx.rowCount).toBe(5)
    expect(ctx.columnCount).toBe(4)
  })

  it('includes groupedData for string+numeric combos', () => {
    const ctx = buildPreComputedContext(SALES_DATA, COLUMNS, schema)
    expect(typeof ctx.groupedData).toBe('object')
    // Should have at least one grouping (region_by_sales or similar)
    expect(Object.keys(ctx.groupedData).length).toBeGreaterThan(0)
  })

  it('returns anomalies array', () => {
    const ctx = buildPreComputedContext(SALES_DATA, COLUMNS, schema)
    expect(Array.isArray(ctx.anomalies)).toBe(true)
  })
})
