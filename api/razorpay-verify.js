import { createHmac } from 'crypto'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!keySecret) {
    return res.status(500).json({ error: 'Razorpay key secret not configured' })
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      billing,
      userId,
    } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification fields' })
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = createHmac('sha256', keySecret)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' })
    }

    // Payment verified! Update user's plan in Supabase
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Calculate plan expiry
      const now = new Date()
      const expiresAt = new Date(now)
      if (billing === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1)
      }

      // Update profile with plan info
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          plan: plan,
          billing_period: billing,
          razorpay_payment_id,
          razorpay_order_id,
          plan_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      if (profileError) {
        console.error('Failed to update profile:', profileError)
        // Payment was successful, don't fail — just log
      }
    }

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
