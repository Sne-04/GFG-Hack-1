import { validateCoupon } from './coupons.js'

// Base prices in ₹ (rupees, not paise)
const PRICES = {
  pro: { monthly: 499, yearly: 4999 },
  enterprise: { monthly: 2999, yearly: 29999 },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code, plan, billing = 'monthly' } = req.body

  if (!code || !plan) {
    return res.status(400).json({ error: 'Missing code or plan' })
  }

  const result = validateCoupon(code, plan)

  if (!result.valid) {
    return res.status(400).json({ error: result.error })
  }

  const planPrices = PRICES[plan]
  if (!planPrices) {
    return res.status(400).json({ error: 'Invalid plan' })
  }

  const basePrice = planPrices[billing]
  const discountAmount = Math.floor(basePrice * result.discount / 100)
  const finalPrice = basePrice - discountAmount

  return res.status(200).json({
    valid: true,
    code: code.trim().toUpperCase(),
    discount: result.discount,
    label: result.label,
    isFree: finalPrice === 0,
    originalPrice: basePrice,
    discountAmount,
    finalPrice,
  })
}
