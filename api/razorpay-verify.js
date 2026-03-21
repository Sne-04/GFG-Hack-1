import { createHmac } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { validateCoupon } from './coupons.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  try {
    const {
      freeActivation,
      couponCode,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      billing,
      userId,
    } = req.body

    // ── Free coupon activation (100% off — no Razorpay needed) ──────
    // NOTE: keySecret is NOT required here — free coupons skip payment entirely
    if (freeActivation) {
      if (!couponCode || !plan || !billing || !userId) {
        return res.status(400).json({ error: 'Missing fields for free activation' })
      }

      const coupon = validateCoupon(couponCode, plan)
      if (!coupon.valid || !coupon.isFree) {
        return res.status(400).json({ error: 'Invalid or non-free coupon code' })
      }

      // Save plan via service role key (server-side, preferred)
      const serverSaved = await activatePlan({
        supabaseUrl,
        supabaseServiceKey,
        userId,
        plan,
        billing,
        paymentId: `free_coupon_${couponCode}`,
        orderId: `free_${Date.now()}`,
      })

      return res.status(200).json({
        success: true,
        serverSaved,
        message: `Plan activated free with coupon ${couponCode}`,
        plan,
        billing,
      })
    }

    // ── Normal Razorpay payment verification ────────────────────────
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      return res.status(500).json({ error: 'Razorpay key secret not configured' })
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification fields' })
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = createHmac('sha256', keySecret)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' })
    }

    await activatePlan({
      supabaseUrl,
      supabaseServiceKey,
      userId,
      plan,
      billing,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    })

    return res.status(200).json({
      success: true,
      message: 'Payment verified and plan activated',
      plan,
      billing,
    })

  } catch (error) {
    console.error('Payment verification error:', error)
    return res.status(500).json({ error: 'Payment verification failed' })
  }
}

/**
 * Saves the plan to Supabase using the service role key.
 * Returns true if saved, false if skipped (keys not configured).
 */
async function activatePlan({ supabaseUrl, supabaseServiceKey, userId, plan, billing, paymentId, orderId }) {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[razorpay-verify] No service role key — skipping server-side plan save. Client will save via session.')
    return false
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const now = new Date()
  const expiresAt = new Date(now)
  if (billing === 'yearly') {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1)
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      plan,
      billing_period: billing,
      razorpay_payment_id: paymentId,
      razorpay_order_id: orderId,
      plan_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (error) {
    console.error('[razorpay-verify] Failed to update profile plan:', error)
    return false
  }

  return true
}
