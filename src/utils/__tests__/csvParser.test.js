import { describe, it, expect } from 'vitest'
import { getSchema, getSampleRows, getCategoricalColumns } from '../csvParser'

const SAMPLE_DATA = [
  { product: 'Apple', category: 'Fruit', sales: 100, revenue: 500 },
  { product: 'Banana', category: 'Fruit', sales: 200, revenue: 800 },
  { product: 'Carrot', category: 'Vegetable', sales: 150, revenue: 450 },
  { product: 'Daikon', category: 'Vegetable', sales: 80, revenue: 240 },
  { product: 'Elderberry', category: 'Fruit', sales: 60, revenue: 360 },
]
const COLUMNS = ['product', 'category', 'sales', 'revenue']

describe('getSchema', () => {
  it('detects numeric columns', () => {
    const schema = getSchema(COLUMNS, SAMPLE_DATA)
    const sales = schema.find(s => s.name === 'sales')
    expect(sales.type).toBe('number')
  })

  it('detects string columns', () => {
    const schema = getSchema(COLUMNS, SAMPLE_DATA)
    const cat = schema.find(s => s.name === 'category')
    expect(cat.type).toBe('string')
  })

  it('includes sample values', () => {
    const schema = getSchema(COLUMNS, SAMPLE_DATA)
    const product = schema.find(s => s.name === 'product')
    expect(product.sample).toBeTruthy()
    expect(product.sample).toContain('Apple')
  })

  it('returns one entry per column', () => {
    const schema = getSchema(COLUMNS, SAMPLE_DATA)
    expect(schema).toHaveLength(COLUMNS.length)
  })

  it('handles empty data gracefully', () => {
    const schema = getSchema(COLUMNS, [])
    expect(schema).toHaveLength(COLUMNS.length)
    schema.forEach(s => {
      expect(s).toHaveProperty('name')
      expect(s).toHaveProperty('type')
    })
  })
})

describe('getSampleRows', () => {
  it('returns up to n rows', () => {
    const rows = getSampleRows(SAMPLE_DATA, 3)
    expect(rows).toHaveLength(3)
  })

  it('returns all rows when n > data length', () => {
    const rows = getSampleRows(SAMPLE_DATA, 100)
    expect(rows).toHaveLength(SAMPLE_DATA.length)
  })

  it('defaults to 50 rows', () => {
    const big = Array.from({ length: 100 }, (_, i) => ({ id: i }))
    const rows = getSampleRows(big)
    expect(rows).toHaveLength(50)
  })
})

describe('getCategoricalColumns', () => {
  it('returns columns with 2–10 unique string values', () => {
    const cats = getCategoricalColumns(COLUMNS, SAMPLE_DATA)
    expect(cats).toContain('category')
  })

  it('excludes ID/email/address columns by keyword', () => {
    const data = [
      { email: 'a@b.com', id: 1, status: 'active' },
      { email: 'c@d.com', id: 2, status: 'inactive' },
    ]
    const cols = getCategoricalColumns(['email', 'id', 'status'], data)
    expect(cols).not.toContain('email')
    expect(cols).not.toContain('id')
    expect(cols).toContain('status')
  })

  it('excludes numeric columns', () => {
    const cats = getCategoricalColumns(COLUMNS, SAMPLE_DATA)
    expect(cats).not.toContain('sales')
    expect(cats).not.toContain('revenue')
  })

  it('excludes columns with too many unique values', () => {
    // product has 5 unique values (≤10) — edge case; add 11 unique string rows
    const bigData = Array.from({ length: 15 }, (_, i) => ({ tag: `tag_${i}`, val: i }))
    const cats = getCategoricalColumns(['tag', 'val'], bigData)
    expect(cats).not.toContain('tag') // 15 unique > 10
  })

  it('returns at most 4 columns', () => {
    const data = Array.from({ length: 5 }, (_, i) => ({
      a: `a${i % 3}`, b: `b${i % 3}`, c: `c${i % 3}`, d: `d${i % 3}`, e: `e${i % 3}`,
    }))
    const cats = getCategoricalColumns(['a', 'b', 'c', 'd', 'e'], data)
    expect(cats.length).toBeLessThanOrEqual(4)
  })
})
