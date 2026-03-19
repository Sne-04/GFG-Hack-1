import Razorpay from 'razorpay'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    return res.status(500).json({ error: 'Razorpay keys not configured' })
  }

  try {
    const { plan, billing, userId, userEmail } = req.body

    if (!plan || !billing || !userId) {
      return res.status(400).json({ error: 'Missing required fields: plan, billing, userId' })
    }

    // Plan pricing in paise (₹1 = 100 paise)
    const prices = {
      pro: { monthly: 49900, yearly: 499900 },
      enterprise: { monthly: 299900, yearly: 2999900 },
    }

    const planPrices = prices[plan]
    if (!planPrices) {
      return res.status(400).json({ error: 'Invalid plan' })
    }

    const amount = planPrices[billing]
    if (!amount) {
      return res.status(400).json({ error: 'Invalid billing period' })
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `datamind_${plan}_${userId.slice(0, 8)}_${Date.now()}`,
      notes: {
        plan,
        billing,
        userId,
        userEmail: userEmail || '',
      },
    })

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    })
  } catch (error) {
    console.error('Razorpay order error:', error)
    return res.status(500).json({ error: 'Failed to create order' })
  }
}
