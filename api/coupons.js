// Coupon definitions — server-side only (never sent to client)
// Founder codes give 100% off and skip Razorpay entirely

export const COUPONS = {
  // ── Founder codes ──────────────────────────────────────────
  'DATAMIND_PRO_FOUNDER': {
    discount: 100,
    plans: ['pro'],
    label: 'Founder Pro Access',
  },
  'DATAMIND_ENT_FOUNDER': {
    discount: 100,
    plans: ['enterprise'],
    label: 'Founder Enterprise Access',
  },

  // ── Launch promos ───────────────────────────────────────────
  'LAUNCH50': {
    discount: 50,
    plans: ['pro', 'enterprise'],
    label: '50% Launch Discount',
  },
  'GFG2026': {
    discount: 40,
    plans: ['pro', 'enterprise'],
    label: '40% GFG Hackfest 2026 Discount',
  },

  // ── User coupons ────────────────────────────────────────────
  'WELCOME20': {
    discount: 20,
    plans: ['pro', 'enterprise'],
    label: '20% Welcome Discount',
  },
  'STUDENT30': {
    discount: 30,
    plans: ['pro'],
    label: '30% Student Discount',
  },
}

/**
 * Validate a coupon code for a given plan.
 * @param {string} code
 * @param {string} plan — 'pro' | 'enterprise'
 * @returns {{ valid: boolean, discount?: number, label?: string, isFree?: boolean, error?: string }}
 */
export function validateCoupon(code, plan) {
  if (!code) return { valid: false, error: 'No coupon code provided' }

  const coupon = COUPONS[code.trim().toUpperCase()]
  if (!coupon) return { valid: false, error: 'Invalid coupon code' }

  if (!coupon.plans.includes(plan)) {
    return { valid: false, error: `This coupon is not valid for the ${plan} plan` }
  }

  return {
    valid: true,
    discount: coupon.discount,
    label: coupon.label,
    isFree: coupon.discount === 100,
  }
}
