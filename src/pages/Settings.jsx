import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Database, User, Settings as SettingsIcon, CreditCard, Shield, ArrowLeft, Camera, Save, Check, Lock, Eye, EyeOff, Trash2, AlertTriangle, Tag, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, upsertProfile, getProfile } from '../utils/supabase'
import { PLANS, getPlan, formatPrice } from '../utils/quota'

const TABS = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
  { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
  { id: 'security', label: 'Privacy & Security', icon: Shield },
]

export default function SettingsPage() {
  const { user, plan: userPlan, refreshPlan } = useAuth()
  const [billingPeriod, setBillingPeriod] = useState('monthly')
  const [upgrading, setUpgrading] = useState(null)
  const [couponInputs, setCouponInputs] = useState({ pro: '', enterprise: '' })
  const [couponStatus, setCouponStatus] = useState({ pro: null, enterprise: null })
  const [applyingCoupon, setApplyingCoupon] = useState({ pro: false, enterprise: false })
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Profile state
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [phone, setPhone] = useState('')

  // Security state
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  // Settings state
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [queryHistory, setQueryHistory] = useState(true)
  const [autoSave, setAutoSave] = useState(false)

  useEffect(() => {
    if (!user) return
    setName(user.user_metadata?.name || user.email?.split('@')[0] || '')
    // Load profile from DB
    getProfile(user.id).then(profile => {
      if (profile) {
        setCompany(profile.company || '')
        setRole(profile.role || '')
        setPhone(profile.phone || '')
      }
    }).catch(() => {})
  }, [user])

  if (!user) return null

  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const avatarUrl = user.user_metadata?.avatar_url || null

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      // Update auth metadata
      await supabase.auth.updateUser({ data: { name } })
      // Update profile in DB
      await upsertProfile(user.id, { name, company, role, phone })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Failed to save profile:', err)
    }
    setSaving(false)
  }

  const handleChangePassword = async () => {
    setPwError('')
    setPwSuccess(false)
    if (!newPw || !confirmPw) { setPwError('Please fill in all fields'); return }
    if (newPw.length < 6) { setPwError('Password must be at least 6 characters'); return }
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error
      setPwSuccess(true)
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      setTimeout(() => setPwSuccess(false), 3000)
    } catch (err) {
      setPwError(err.message || 'Failed to change password')
    }
    setSaving(false)
  }

  const applyCoupon = async (planId) => {
    const code = couponInputs[planId]?.trim()
    if (!code) return
    setApplyingCoupon(prev => ({ ...prev, [planId]: true }))
    try {
      const res = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, plan: planId, billing: billingPeriod }),
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

  return (
    <div className="min-h-screen bg-[#08080c] text-slate-200">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#08080c] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Database size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm">Settings</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className="md:w-52 shrink-0">
            <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
              {TABS.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary/15 text-primary border border-primary/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <Icon size={14} /> {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

              {/* ── PROFILE TAB ── */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">My Profile</h2>
                    <p className="text-xs text-slate-500">Manage your personal information</p>
                  </div>

                  {/* Avatar */}
                  <div className="glass rounded-2xl p-6 border border-white/5">
                    <div className="flex items-center gap-5">
                      <div className="relative group">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={name} className="w-20 h-20 rounded-2xl object-cover ring-2 ring-primary/30" />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-white">
                            {initials}
                          </div>
                        )}
                        <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <Camera size={20} className="text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                        <p className="text-[10px] text-slate-600 mt-1">Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5 block">Full Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full glass rounded-lg px-3 py-2.5 text-sm bg-transparent outline-none text-slate-200 focus:ring-1 focus:ring-primary/40" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5 block">Email</label>
                        <input value={user.email} disabled className="w-full glass rounded-lg px-3 py-2.5 text-sm bg-transparent outline-none text-slate-500 cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5 block">Company</label>
                        <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company" className="w-full glass rounded-lg px-3 py-2.5 text-sm bg-transparent outline-none text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-primary/40" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5 block">Role</label>
                        <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Data Analyst" className="w-full glass rounded-lg px-3 py-2.5 text-sm bg-transparent outline-none text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-primary/40" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5 block">Phone</label>
                        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 ..." className="w-full glass rounded-lg px-3 py-2.5 text-sm bg-transparent outline-none text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-primary/40" />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button onClick={handleSaveProfile} disabled={saving}
                        className={`glow-btn rounded-xl px-6 py-2.5 text-xs font-semibold text-white flex items-center gap-2 disabled:opacity-50 ${saved ? '!bg-emerald-600 !shadow-emerald-500/30' : ''}`}>
                        {saved ? <><Check size={13} /> Saved!</> : saving ? <span className="animate-pulse">Saving...</span> : <><Save size={13} /> Save Changes</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SETTINGS TAB ── */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">Settings</h2>
                    <p className="text-xs text-slate-500">Configure your preferences</p>
                  </div>

                  <div className="glass rounded-2xl p-6 border border-white/5 space-y-5">
                    <ToggleRow
                      label="Email Notifications"
                      desc="Receive emails about new features and updates"
                      checked={emailNotifs}
                      onChange={setEmailNotifs}
                    />
                    <div className="border-t border-white/5" />
                    <ToggleRow
                      label="Save Query History"
                      desc="Store your queries for quick access later"
                      checked={queryHistory}
                      onChange={setQueryHistory}
                    />
                    <div className="border-t border-white/5" />
                    <ToggleRow
                      label="Auto-save Dashboards"
                      desc="Automatically save dashboards after each query"
                      checked={autoSave}
                      onChange={setAutoSave}
                    />
                  </div>

                  <div className="glass rounded-2xl p-6 border border-white/5">
                    <h3 className="text-sm font-semibold text-white mb-1">Theme</h3>
                    <p className="text-[10px] text-slate-500 mb-3">You can change the theme from the sidebar in the dashboard</p>
                    <Link to="/dashboard" className="text-xs text-primary hover:underline">Go to Dashboard →</Link>
                  </div>
                </div>
              )}

              {/* ── BILLING TAB ── */}
              {activeTab === 'billing' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">Billing & Plan</h2>
                    <p className="text-xs text-slate-500">Manage your subscription</p>
                  </div>

                  {/* Current Plan */}
                  {(() => {
                    const currentPlan = getPlan(userPlan)
                    return (
                      <div className="glass rounded-2xl p-6 border border-primary/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/20">
                              Current Plan
                            </span>
                            {userPlan !== 'free' && (
                              <span className="text-[9px] text-slate-500">Renews automatically</span>
                            )}
                          </div>
                          <h3 className="text-2xl font-black text-white mb-1">{currentPlan.name}</h3>
                          <p className="text-xs text-slate-400 mb-4">
                            {userPlan === 'free' ? 'Basic features for personal use' : `${currentPlan.limits.queriesPerDay === -1 ? 'Unlimited' : currentPlan.limits.queriesPerDay} queries/day • ${currentPlan.limits.csvMaxSizeMB}MB uploads`}
                          </p>
                          <div className="space-y-2 text-xs text-slate-400">
                            {currentPlan.features.slice(0, 4).map((f, i) => (
                              <div key={i} className="flex items-center gap-2"><Check size={12} className="text-emerald-400" /> {f}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Billing toggle */}
                  {userPlan === 'free' && (
                    <div className="flex items-center justify-center gap-3">
                      <span className={`text-xs ${billingPeriod === 'monthly' ? 'text-white font-medium' : 'text-slate-500'}`}>Monthly</span>
                      <button
                        onClick={() => setBillingPeriod(b => b === 'monthly' ? 'yearly' : 'monthly')}
                        className={`relative w-12 h-6 rounded-full transition-colors ${billingPeriod === 'yearly' ? 'bg-primary' : 'bg-white/10'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${billingPeriod === 'yearly' ? 'left-7' : 'left-1'}`} />
                      </button>
                      <span className={`text-xs ${billingPeriod === 'yearly' ? 'text-white font-medium' : 'text-slate-500'}`}>
                        Yearly <span className="text-emerald-400 text-[10px]">Save 17%</span>
                      </span>
                    </div>
                  )}

                  {/* Upgrade Cards */}
                  {userPlan === 'free' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {['pro', 'enterprise'].map(planId => {
                        const p = getPlan(planId)
                        const price = billingPeriod === 'yearly' ? p.priceYearly : p.priceMonthly
                        const isPro = planId === 'pro'

                        const handleUpgrade = async () => {
                          if (planId === 'enterprise') {
                            window.open('mailto:support@datamind.ai?subject=Enterprise%20Plan%20Inquiry', '_blank')
                            return
                          }
                          const coupon = couponStatus[planId]
                          setUpgrading(planId)
                          try {
                            // 100% free coupon — skip Razorpay
                            if (coupon?.isFree) {
                              const verifyRes = await fetch('/api/razorpay-verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ freeActivation: true, couponCode: coupon.code, plan: planId, billing: billingPeriod, userId: user.id }),
                              })
                              const verifyData = await verifyRes.json()
                              if (verifyData.success) {
                                refreshPlan(user.id)
                                setSaved(true)
                                setTimeout(() => setSaved(false), 3000)
                              } else {
                                alert('Activation failed. Please try again.')
                              }
                              return
                            }

                            const res = await fetch('/api/razorpay-order', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ plan: planId, billing: billingPeriod, userId: user.id, userEmail: user.email, couponCode: coupon?.code || null }),
                            })
                            const data = await res.json()
                            if (!res.ok) throw new Error(data.error)

                            const options = {
                              key: data.keyId,
                              amount: data.amount,
                              currency: data.currency,
                              name: 'DataMind AI',
                              description: `${p.name} Plan — ${billingPeriod === 'yearly' ? 'Annual' : 'Monthly'}`,
                              order_id: data.orderId,
                              prefill: { email: user.email, name: user.user_metadata?.name || '' },
                              theme: { color: '#6366f1' },
                              handler: async (response) => {
                                const verifyRes = await fetch('/api/razorpay-verify', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ ...response, plan: planId, billing: billingPeriod, userId: user.id }),
                                })
                                const verifyData = await verifyRes.json()
                                if (verifyData.success) {
                                  refreshPlan(user.id)
                                  setSaved(true)
                                  setTimeout(() => setSaved(false), 3000)
                                } else {
                                  alert('Payment verification failed. Contact support if money was deducted.')
                                }
                              },
                              modal: { ondismiss: () => setUpgrading(null) },
                            }
                            const razorpay = new window.Razorpay(options)
                            razorpay.open()
                          } catch (err) {
                            alert(err.message || 'Something went wrong')
                          } finally {
                            setUpgrading(null)
                          }
                        }

                        const cs = couponStatus[planId]
                        const displayPrice = cs?.valid && cs.finalPrice !== undefined ? cs.finalPrice : price

                        return (
                          <div key={planId} className={`glass rounded-2xl p-5 border transition-all ${isPro ? 'border-white/5 hover:border-primary/30' : 'border-white/5 hover:border-secondary/30'}`}>
                            <h4 className="font-bold text-white text-sm mb-0.5">{p.name}</h4>
                            <div className="flex items-baseline gap-1 mb-0.5">
                              <p className={`text-xl font-black ${cs?.isFree ? 'text-emerald-400' : isPro ? 'text-primary' : 'text-secondary'}`}>
                                {cs?.isFree ? 'FREE' : formatPrice(displayPrice)}
                              </p>
                              {!cs?.isFree && (
                                <span className="text-xs text-slate-500 font-normal">/{billingPeriod === 'yearly' ? 'yr' : 'mo'}</span>
                              )}
                            </div>
                            {cs?.valid && !cs.isFree && (
                              <p className="text-[9px] mb-1">
                                <span className="text-slate-500 line-through">{formatPrice(price)}</span>
                                <span className="text-emerald-400 ml-1">{cs.discount}% off</span>
                              </p>
                            )}
                            {billingPeriod === 'yearly' && !cs?.valid && (
                              <p className="text-[9px] text-emerald-400 mb-2">Save {formatPrice(p.priceMonthly * 12 - p.priceYearly)}/year</p>
                            )}
                            <div className="space-y-1.5 text-[10px] text-slate-400 mb-3 mt-2">
                              {p.features.slice(0, 4).map((f, i) => (
                                <div key={i} className="flex items-center gap-1.5"><Check size={10} className="text-emerald-400" /> {f}</div>
                              ))}
                            </div>
                            <button
                              onClick={handleUpgrade}
                              disabled={upgrading === planId}
                              className={`w-full rounded-lg py-2 text-xs font-semibold transition-all ${
                                cs?.isFree
                                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                  : isPro ? 'glow-btn text-white' : 'border border-secondary/30 text-secondary hover:bg-secondary/10'
                              } ${upgrading === planId ? 'opacity-50 cursor-wait' : ''}`}
                            >
                              {upgrading === planId ? 'Processing...' : cs?.isFree ? 'Activate Free' : isPro ? 'Upgrade to Pro' : 'Contact Sales'}
                            </button>

                            {/* Coupon input */}
                            {isPro && (
                              <div className="mt-2.5">
                                {cs?.valid ? (
                                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 py-1.5">
                                    <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                                      <Check size={9} /> {cs.label}{cs.isFree ? ' — FREE!' : ` — ${cs.discount}% off`}
                                    </span>
                                    <button onClick={() => removeCoupon(planId)} className="text-[9px] text-slate-500 hover:text-slate-300 ml-1">✕</button>
                                  </div>
                                ) : (
                                  <div className="flex gap-1">
                                    <div className="flex-1 flex items-center bg-white/5 rounded-lg px-2 gap-1 focus-within:ring-1 focus-within:ring-primary/40">
                                      <Tag size={9} className="text-slate-600 shrink-0" />
                                      <input
                                        value={couponInputs[planId] || ''}
                                        onChange={e => {
                                          const val = e.target.value.toUpperCase()
                                          setCouponInputs(prev => ({ ...prev, [planId]: val }))
                                          if (couponStatus[planId]?.error) setCouponStatus(prev => ({ ...prev, [planId]: null }))
                                        }}
                                        onKeyDown={e => e.key === 'Enter' && applyCoupon(planId)}
                                        placeholder="Coupon code"
                                        className="flex-1 bg-transparent py-1.5 text-[10px] text-slate-200 placeholder:text-slate-600 outline-none"
                                      />
                                    </div>
                                    <button
                                      onClick={() => applyCoupon(planId)}
                                      disabled={applyingCoupon[planId] || !couponInputs[planId]?.trim()}
                                      className="px-2 py-1.5 rounded-lg bg-primary/20 text-primary text-[9px] font-semibold hover:bg-primary/30 transition-colors disabled:opacity-40"
                                    >
                                      {applyingCoupon[planId] ? <Loader2 size={9} className="animate-spin" /> : 'Apply'}
                                    </button>
                                  </div>
                                )}
                                {cs?.valid === false && cs.error && (
                                  <p className="text-[9px] text-red-400 mt-1">{cs.error}</p>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* View all plans link */}
                  <div className="text-center">
                    <Link to="/pricing" className="text-xs text-primary hover:underline">View detailed plan comparison →</Link>
                  </div>
                </div>
              )}

              {/* ── SECURITY TAB ── */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">Privacy & Security</h2>
                    <p className="text-xs text-slate-500">Manage your password and account security</p>
                  </div>

                  {/* Change Password */}
                  <div className="glass rounded-2xl p-6 border border-white/5">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                      <Lock size={14} className="text-primary" /> Change Password
                    </h3>

                    {pwError && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-xs text-red-400">{pwError}</div>
                    )}
                    {pwSuccess && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 mb-4 text-xs text-emerald-400 flex items-center gap-2">
                        <Check size={12} /> Password updated successfully!
                      </div>
                    )}

                    <div className="space-y-3 max-w-md">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5 block">New Password</label>
                        <div className="flex items-center glass rounded-lg px-3 focus-within:ring-1 focus-within:ring-primary/40">
                          <Lock size={13} className="text-slate-500 shrink-0" />
                          <input
                            type={showPw ? 'text' : 'password'}
                            value={newPw}
                            onChange={e => setNewPw(e.target.value)}
                            placeholder="Min 6 characters"
                            className="flex-1 bg-transparent py-2.5 px-2 text-sm outline-none text-slate-200 placeholder:text-slate-600"
                          />
                          <button type="button" onClick={() => setShowPw(!showPw)} className="text-slate-500 hover:text-slate-300">
                            {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5 block">Confirm New Password</label>
                        <div className="flex items-center glass rounded-lg px-3 focus-within:ring-1 focus-within:ring-primary/40">
                          <Lock size={13} className="text-slate-500 shrink-0" />
                          <input
                            type={showPw ? 'text' : 'password'}
                            value={confirmPw}
                            onChange={e => setConfirmPw(e.target.value)}
                            placeholder="Re-enter password"
                            className="flex-1 bg-transparent py-2.5 px-2 text-sm outline-none text-slate-200 placeholder:text-slate-600"
                          />
                        </div>
                      </div>

                      {newPw && (
                        <div className="space-y-1 pt-1">
                          <div className={`flex items-center gap-1.5 text-[10px] ${newPw.length >= 6 ? 'text-emerald-400' : 'text-slate-500'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${newPw.length >= 6 ? 'bg-emerald-400' : 'bg-slate-600'}`} /> At least 6 characters
                          </div>
                          <div className={`flex items-center gap-1.5 text-[10px] ${newPw === confirmPw && confirmPw ? 'text-emerald-400' : 'text-slate-500'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${newPw === confirmPw && confirmPw ? 'bg-emerald-400' : 'bg-slate-600'}`} /> Passwords match
                          </div>
                        </div>
                      )}

                      <button onClick={handleChangePassword} disabled={saving}
                        className="glow-btn rounded-xl px-6 py-2.5 text-xs font-semibold text-white flex items-center gap-2 disabled:opacity-50 mt-2">
                        {saving ? <span className="animate-pulse">Updating...</span> : <><Shield size={13} /> Update Password</>}
                      </button>
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div className="glass rounded-2xl p-6 border border-white/5">
                    <h3 className="text-sm font-semibold text-white mb-3">Active Sessions</h3>
                    <div className="glass rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-200 font-medium">Current Session</p>
                        <p className="text-[10px] text-slate-500">Logged in via {user.app_metadata?.provider === 'google' ? 'Google' : 'Email'}</p>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-bold">Active</span>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="glass rounded-2xl p-6 border border-red-500/10">
                    <h3 className="text-sm font-semibold text-red-400 mb-1 flex items-center gap-2">
                      <AlertTriangle size={14} /> Danger Zone
                    </h3>
                    <p className="text-[10px] text-slate-500 mb-3">Once you delete your account, there is no going back.</p>
                    <button className="border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-lg px-4 py-2 text-xs font-medium transition-colors flex items-center gap-2">
                      <Trash2 size={12} /> Delete Account
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Toggle component
function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-slate-200">{label}</p>
        <p className="text-[10px] text-slate-500">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-slate-700'}`}
      >
        <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
      </button>
    </div>
  )
}
