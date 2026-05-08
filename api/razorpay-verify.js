import { createHmac } from 'crypto'
import { getSQL } from './_lib/neon.js'
import { validateCoupon } from './coupons.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

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
    if (freeActivation) {
      if (!couponCode || !plan || !billing || !userId) {
        return res.status(400).json({ error: 'Missing fields for free activation' })
      }

      const coupon = validateCoupon(couponCode, plan)
      if (!coupon.valid || !coupon.isFree) {
        return res.status(400).json({ error: 'Invalid or non-free coupon code' })
      }

      const serverSaved = await activatePlan({
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
 * Saves the plan to Neon PostgreSQL.
 */
async function activatePlan({ userId, plan, billing, paymentId, orderId }) {
  try {
    const sql = getSQL()

    const now = new Date()
    const expiresAt = new Date(now)
    if (billing === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    }

    await sql`
      INSERT INTO profiles (user_id, plan, billing_period, razorpay_payment_id, razorpay_order_id, plan_expires_at, updated_at)
      VALUES (${userId}, ${plan}, ${billing}, ${paymentId}, ${orderId}, ${expiresAt.toISOString()}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        plan = EXCLUDED.plan,
        billing_period = EXCLUDED.billing_period,
        razorpay_payment_id = EXCLUDED.razorpay_payment_id,
        razorpay_order_id = EXCLUDED.razorpay_order_id,
        plan_expires_at = EXCLUDED.plan_expires_at,
        updated_at = NOW()
    `
    return true
  } catch (error) {
    console.error('[razorpay-verify] Failed to update profile plan:', error)
    return false
  }
}
