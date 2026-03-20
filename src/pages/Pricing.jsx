import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, X, Zap, Crown, Building2, ArrowRight, Database, Sparkles, Tag, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { PLANS, formatPrice } from '../utils/quota'

export default function Pricing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [billing, setBilling] = useState('monthly')
  const [loading, setLoading] = useState(null)

  // Coupon state per plan
  const [couponInputs, setCouponInputs] = useState({ pro: '', enterprise: '' })
  const [couponStatus, setCouponStatus] = useState({ pro: null, enterprise: null })
  const [applyingCoupon, setApplyingCoupon] = useState({ pro: false, enterprise: false })

  const applyCoupon = async (planId) => {
    const code = couponInputs[planId]?.trim()
    if (!code) return

    setApplyingCoupon(prev => ({ ...prev, [planId]: true }))
    try {
      const res = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, plan: planId, billing }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCouponStatus(prev => ({ ...prev, [planId]: { valid: false, error: data.error } }))
      } else {
        setCouponStatus(prev => ({ ...prev, [planId]: data }))
      }
    } catch {
      setCouponStatus(prev => ({ ...prev, [planId]: { valid: false, error: 'Failed to validate coupon' } }))
    }
    setApplyingCoupon(prev => ({ ...prev, [planId]: false }))
  }

  const removeCoupon = (planId) => {
    setCouponStatus(prev => ({ ...prev, [planId]: null }))
    setCouponInputs(prev => ({ ...prev, [planId]: '' }))
  }

  const handleUpgrade = async (planId) => {
    if (!user) {
      navigate('/signup')
      return
    }

    if (planId === 'enterprise') {
      window.open('mailto:support@datamind.ai?subject=Enterprise%20Plan%20Inquiry', '_blank')
      return
    }

    const coupon = couponStatus[planId]
    setLoading(planId)

    try {
      // 100% free coupon — activate without Razorpay
      if (coupon?.isFree) {
        const verifyRes = await fetch('/api/razorpay-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            freeActivation: true,
            couponCode: coupon.code,
            plan: planId,
            billing,
            userId: user.id,
          }),
        })
        const verifyData = await verifyRes.json()
        if (verifyData.success) {
          navigate('/settings?tab=billing&upgraded=true')
        } else {
          alert('Activation failed. Please try again.')
        }
        return
      }

      // Create Razorpay order (with optional discount)
      const res = await fetch('/api/razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planId,
          billing,
          userId: user.id,
          userEmail: user.email,
          couponCode: coupon?.code || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create order')

      // Open Razorpay checkout
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'DataMind AI',
        description: `${PLANS[planId].name} Plan — ${billing === 'yearly' ? 'Annual' : 'Monthly'}`,
        order_id: data.orderId,
        prefill: {
          email: user.email,
          name: user.user_metadata?.name || '',
        },
        theme: { color: '#6366f1' },
        handler: async function (response) {
          try {
            const verifyRes = await fetch('/api/razorpay-verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: planId,
                billing,
                userId: user.id,
              }),
            })
            const verifyData = await verifyRes.json()
            if (verifyData.success) {
              navigate('/settings?tab=billing&upgraded=true')
            } else {
              alert('Payment verification failed. Contact support if money was deducted.')
            }
          } catch {
            alert('Payment verification failed. Contact support.')
          }
        },
        modal: {
          ondismiss: () => setLoading(null),
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err) {
      alert(err.message || 'Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  const plans = [
    {
      ...PLANS.free,
      icon: Zap,
      color: 'slate',
      gradient: 'from-slate-500 to-slate-600',
      popular: false,
      cta: user ? 'Current Plan' : 'Get Started Free',
      ctaAction: () => navigate(user ? '/dashboard' : '/signup'),
      ctaStyle: 'border border-white/10 text-slate-300 hover:bg-white/5',
    },
    {
      ...PLANS.pro,
      icon: Crown,
      color: 'primary',
      gradient: 'from-indigo-500 to-purple-600',
      popular: true,
      cta: 'Upgrade to Pro',
      ctaAction: () => handleUpgrade('pro'),
      ctaStyle: 'glow-btn text-white',
    },
    {
      ...PLANS.enterprise,
      icon: Building2,
      color: 'secondary',
      gradient: 'from-emerald-500 to-teal-600',
      popular: false,
      cta: 'Contact Sales',
      ctaAction: () => handleUpgrade('enterprise'),
      ctaStyle: 'border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10',
    },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Database size={20} className="text-primary" />
            <span className="font-bold text-sm">DataMind AI</span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard" className="text-xs text-slate-400 hover:text-white transition-colors">
                Dashboard <ArrowRight size={12} className="inline ml-1" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-xs text-slate-400 hover:text-white transition-colors">Login</Link>
                <Link to="/signup" className="glow-btn text-xs px-4 py-2 rounded-lg text-white font-medium">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="text-center pt-16 pb-10 px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-medium mb-6">
            <Sparkles size={12} /> Simple, transparent pricing
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4">
            Choose the right plan for<br />
            <span className="bg-gradient-to-r from-primary via-purple-400 to-secondary bg-clip-text text-transparent">your data needs</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Start free, upgrade when you need more. All plans include our AI-powered analytics engine.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-3 mt-8"
        >
          <span className={`text-xs ${billing === 'monthly' ? 'text-white font-medium' : 'text-slate-500'}`}>Monthly</span>
          <button
            onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative w-12 h-6 rounded-full transition-colors ${billing === 'yearly' ? 'bg-primary' : 'bg-white/10'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${billing === 'yearly' ? 'left-7' : 'left-1'}`} />
          </button>
          <span className={`text-xs ${billing === 'yearly' ? 'text-white font-medium' : 'text-slate-500'}`}>
            Yearly <span className="text-emerald-400 text-[10px]">Save 17%</span>
          </span>
        </motion.div>
      </div>

      {/* Pricing cards */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => {
            const basePrice = plan.price === 0
              ? 0
              : billing === 'yearly'
                ? plan.priceYearly
                : plan.priceMonthly

            const status = couponStatus[plan.id]
            const displayPrice = status?.valid && status.finalPrice !== undefined
              ? status.finalPrice
              : basePrice

            const ctaLabel = loading === plan.id
              ? 'Processing...'
              : status?.isFree
                ? 'Activate Free'
                : plan.cta

            const ctaStyle = status?.isFree
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              : plan.ctaStyle

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className={`relative rounded-2xl p-6 border transition-all ${
                  plan.popular
                    ? 'border-primary/40 bg-[#101018] shadow-[0_0_40px_rgba(99,102,241,0.15)]'
                    : 'border-white/5 bg-[#101018]/50 hover:border-white/10'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-[10px] font-bold text-white tracking-wider uppercase">
                    Most Popular
                  </div>
                )}

                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4`}>
                  <plan.icon size={18} className="text-white" />
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>

                {/* Price display */}
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-3xl font-black ${status?.isFree ? 'text-emerald-400' : 'text-white'}`}>
                    {status?.isFree ? 'FREE' : displayPrice === 0 ? '₹0' : formatPrice(displayPrice)}
                  </span>
                  {displayPrice > 0 && !status?.isFree && (
                    <span className="text-xs text-slate-500">/{billing === 'yearly' ? 'year' : 'month'}</span>
                  )}
                </div>

                {/* Original price strikethrough when coupon applied */}
                {status?.valid && !status.isFree && basePrice > 0 && (
                  <p className="text-[10px] text-slate-500 mb-1">
                    <span className="line-through">{formatPrice(basePrice)}</span>
                    <span className="text-emerald-400 ml-1">{status.discount}% off applied</span>
                  </p>
                )}

                {billing === 'yearly' && plan.priceMonthly && !status?.valid && (
                  <p className="text-[10px] text-emerald-400 mb-4">
                    Save {formatPrice(plan.priceMonthly * 12 - plan.priceYearly)}/year
                  </p>
                )}

                <div className="mb-6 mt-4">
                  <button
                    onClick={plan.ctaAction}
                    disabled={loading === plan.id}
                    className={`w-full rounded-xl py-3 text-sm font-semibold transition-all ${ctaStyle} ${loading === plan.id ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    {ctaLabel}
                  </button>

                  {/* Coupon input for paid plans */}
                  {plan.id !== 'free' && (
                    <div className="mt-3">
                      {status?.valid ? (
                        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-2">
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1.5">
                            <Check size={10} />
                            {status.label}
                            {status.isFree ? ' — 100% FREE!' : ` — ${status.discount}% off`}
                          </span>
                          <button onClick={() => removeCoupon(plan.id)} className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors ml-2">
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          <div className="flex-1 flex items-center bg-white/5 rounded-lg px-2.5 gap-1.5 focus-within:ring-1 focus-within:ring-primary/40">
                            <Tag size={11} className="text-slate-600 shrink-0" />
                            <input
                              value={couponInputs[plan.id] || ''}
                              onChange={e => {
                                const val = e.target.value.toUpperCase()
                                setCouponInputs(prev => ({ ...prev, [plan.id]: val }))
                                if (couponStatus[plan.id]?.error) {
                                  setCouponStatus(prev => ({ ...prev, [plan.id]: null }))
                                }
                              }}
                              onKeyDown={e => e.key === 'Enter' && applyCoupon(plan.id)}
                              placeholder="Coupon code"
                              className="flex-1 bg-transparent py-1.5 text-[11px] text-slate-200 placeholder:text-slate-600 outline-none"
                            />
                          </div>
                          <button
                            onClick={() => applyCoupon(plan.id)}
                            disabled={applyingCoupon[plan.id] || !couponInputs[plan.id]?.trim()}
                            className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-[10px] font-semibold hover:bg-primary/30 transition-colors disabled:opacity-40"
                          >
                            {applyingCoupon[plan.id] ? <Loader2 size={10} className="animate-spin" /> : 'Apply'}
                          </button>
                        </div>
                      )}
                      {status?.valid === false && status.error && (
                        <p className="text-[10px] text-red-400 mt-1 px-1">{status.error}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2.5">
                  {plan.features.map((feature, j) => (
                    <div key={j} className="flex items-start gap-2 text-xs text-slate-400">
                      <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Feature comparison */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="mt-16"
        >
          <h2 className="text-xl font-bold text-center text-white mb-8">Compare all features</h2>
          <div className="bg-[#101018] rounded-2xl border border-white/5 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left p-4 text-slate-400 font-medium">Feature</th>
                  <th className="p-4 text-slate-300 font-medium">Free</th>
                  <th className="p-4 text-primary font-medium">Pro</th>
                  <th className="p-4 text-emerald-400 font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Queries per day', '5', '200', 'Unlimited'],
                  ['CSV file size', '10MB', '100MB', '500MB'],
                  ['Saved dashboards', '3', 'Unlimited', 'Unlimited'],
                  ['AI chat messages', '20/month', '200/month', 'Unlimited'],
                  ['Chart types', 'Basic 4', 'All + Heatmap', 'All + Custom'],
                  ['Export formats', 'PNG', 'PNG, PDF', 'PNG, PDF, PPT'],
                  ['Team collaboration', <X size={12} className="text-red-400 mx-auto" />, <X size={12} className="text-red-400 mx-auto" />, <Check size={12} className="text-emerald-400 mx-auto" />],
                  ['API access', <X size={12} className="text-red-400 mx-auto" />, <X size={12} className="text-red-400 mx-auto" />, <Check size={12} className="text-emerald-400 mx-auto" />],
                  ['Support', 'Community', 'Email', 'Priority'],
                ].map(([feature, free, pro, enterprise], i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="p-4 text-slate-300">{feature}</td>
                    <td className="p-4 text-center text-slate-500">{free}</td>
                    <td className="p-4 text-center text-slate-300">{pro}</td>
                    <td className="p-4 text-center text-slate-300">{enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <h2 className="text-xl font-bold text-white mb-2">Questions?</h2>
          <p className="text-xs text-slate-500 mb-6">Here are answers to common questions about our pricing.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
            {[
              {
                q: 'Can I switch plans anytime?',
                a: 'Yes! Upgrade or downgrade anytime. When upgrading, you pay the prorated amount. When downgrading, the change takes effect at the end of your billing cycle.'
              },
              {
                q: 'What payment methods are accepted?',
                a: 'We accept all major credit/debit cards, UPI, net banking, and wallets through Razorpay — India\'s most trusted payment gateway.'
              },
              {
                q: 'Is there a refund policy?',
                a: 'Yes, we offer a 7-day money-back guarantee. If you\'re not satisfied, contact us within 7 days for a full refund.'
              },
              {
                q: 'What happens when I exceed my quota?',
                a: 'You\'ll see a friendly upgrade prompt. Your existing dashboards and data remain accessible — you just can\'t run new queries until the next day or you upgrade.'
              },
            ].map((faq, i) => (
              <div key={i} className="bg-[#101018] rounded-xl p-4 border border-white/5">
                <h4 className="text-xs font-semibold text-white mb-2">{faq.q}</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="mt-16 text-center glass rounded-2xl p-8 border border-primary/10"
        >
          <h2 className="text-lg font-bold text-white mb-2">Ready to unlock your data's potential?</h2>
          <p className="text-xs text-slate-400 mb-4">Join thousands of businesses making data-driven decisions with DataMind AI.</p>
          <Link to={user ? '/dashboard' : '/signup'} className="inline-flex items-center gap-2 glow-btn text-white text-sm px-6 py-3 rounded-xl font-semibold">
            {user ? 'Go to Dashboard' : 'Start Free Trial'} <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
