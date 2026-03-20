import { describe, it, expect } from 'vitest'
import {
  getPlan,
  getPlanLimits,
  checkQueryQuota,
  checkFileSizeQuota,
  checkDashboardQuota,
  formatPrice,
} from '../quota'

describe('getPlan', () => {
  it('returns free plan for "free"', () => {
    expect(getPlan('free').id).toBe('free')
  })

  it('returns pro plan for "pro"', () => {
    expect(getPlan('pro').id).toBe('pro')
  })

  it('returns enterprise plan for "enterprise"', () => {
    expect(getPlan('enterprise').id).toBe('enterprise')
  })

  it('falls back to free plan for unknown plan id', () => {
    expect(getPlan('unknown').id).toBe('free')
    expect(getPlan(null).id).toBe('free')
    expect(getPlan(undefined).id).toBe('free')
  })
})

describe('getPlanLimits', () => {
  it('free plan has 5 queries/day limit', () => {
    expect(getPlanLimits('free').queriesPerDay).toBe(5)
  })

  it('pro plan has 200 queries/day limit', () => {
    expect(getPlanLimits('pro').queriesPerDay).toBe(200)
  })

  it('enterprise plan has unlimited queries (-1)', () => {
    expect(getPlanLimits('enterprise').queriesPerDay).toBe(-1)
  })

  it('free plan has 10MB CSV limit', () => {
    expect(getPlanLimits('free').csvMaxSizeMB).toBe(10)
  })

  it('pro plan has 100MB CSV limit', () => {
    expect(getPlanLimits('pro').csvMaxSizeMB).toBe(100)
  })

  it('enterprise plan has 500MB CSV limit', () => {
    expect(getPlanLimits('enterprise').csvMaxSizeMB).toBe(500)
  })
})

describe('checkQueryQuota', () => {
  it('allows query when under limit', () => {
    const result = checkQueryQuota({ today_count: 3 }, 'free')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(2)
  })

  it('blocks query when at limit', () => {
    const result = checkQueryQuota({ today_count: 5 }, 'free')
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('blocks query when over limit', () => {
    const result = checkQueryQuota({ today_count: 10 }, 'free')
    expect(result.allowed).toBe(false)
  })

  it('always allows for enterprise (unlimited)', () => {
    const result = checkQueryQuota({ today_count: 99999 }, 'enterprise')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(-1)
  })

  it('handles missing usage (defaults to 0)', () => {
    const result = checkQueryQuota(null, 'free')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(5)
  })

  it('includes reason message when blocked', () => {
    const result = checkQueryQuota({ today_count: 5 }, 'free')
    expect(result.reason).toBeTruthy()
    expect(typeof result.reason).toBe('string')
  })
})

describe('checkFileSizeQuota', () => {
  it('allows file under limit', () => {
    const result = checkFileSizeQuota(5, 'free')
    expect(result.allowed).toBe(true)
  })

  it('blocks file over limit', () => {
    const result = checkFileSizeQuota(15, 'free')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('10MB')
  })

  it('allows exactly at limit', () => {
    const result = checkFileSizeQuota(10, 'free')
    expect(result.allowed).toBe(true)
  })

  it('pro allows up to 100MB', () => {
    const ok = checkFileSizeQuota(99, 'pro')
    expect(ok.allowed).toBe(true)

    const blocked = checkFileSizeQuota(101, 'pro')
    expect(blocked.allowed).toBe(false)
  })

  it('enterprise allows up to 500MB', () => {
    const ok = checkFileSizeQuota(499, 'enterprise')
    expect(ok.allowed).toBe(true)

    const blocked = checkFileSizeQuota(501, 'enterprise')
    expect(blocked.allowed).toBe(false)
  })
})

describe('checkDashboardQuota', () => {
  it('allows saving when under limit', () => {
    const result = checkDashboardQuota(1, 'free')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(2)
  })

  it('blocks saving when at limit', () => {
    const result = checkDashboardQuota(3, 'free')
    expect(result.allowed).toBe(false)
    expect(result.reason).toBeTruthy()
  })

  it('always allows for pro (unlimited)', () => {
    const result = checkDashboardQuota(9999, 'pro')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(-1)
  })

  it('always allows for enterprise', () => {
    const result = checkDashboardQuota(9999, 'enterprise')
    expect(result.allowed).toBe(true)
  })
})

describe('formatPrice', () => {
  it('returns "Free" for 0', () => {
    expect(formatPrice(0)).toBe('Free')
  })

  it('formats INR price', () => {
    const formatted = formatPrice(499, 'INR')
    expect(formatted).toContain('499')
  })

  it('formats large prices with commas', () => {
    const formatted = formatPrice(2999, 'INR')
    expect(formatted).toContain('2,999')
  })
})
