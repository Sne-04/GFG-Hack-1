// ── Plan definitions & quota checking ──

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'INR',
    period: 'forever',
    limits: {
      queriesPerDay: 5,
      csvMaxSizeMB: 10,
      savedDashboards: 3,
      aiChatMessages: 20,
    },
    features: [
      '5 AI queries per day',
      'CSV upload up to 10MB',
      'Bar, Line, Pie & Area charts',
      'KPI cards & summaries',
      'AI-powered insights',
      'Query history (last 20)',
      '3 saved dashboards',
      'PNG export',
      'Community support',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 499,   // ₹499/mo
    priceYearly: 4999,   // ₹4,999/yr (save ₹989)
    currency: 'INR',
    razorpayPlanIdMonthly: null,
    razorpayPlanIdYearly: null,
    limits: {
      queriesPerDay: 200,
      csvMaxSizeMB: 100,
      savedDashboards: -1,
      aiChatMessages: 200,
    },
    features: [
      '200 AI queries per day',
      'CSV upload up to 100MB',
      'All chart types (+ Heatmap, Scatter)',
      'Advanced analytics & anomaly detection',
      'Priority AI responses',
      'Unlimited saved dashboards',
      'Full query history',
      '200 AI chat messages/month',
      'Custom filters & sorting',
      'Export to PNG & PDF',
      'Email support',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 2999,  // ₹2,999/mo
    priceYearly: 29999,  // ₹29,999/yr
    currency: 'INR',
    razorpayPlanIdMonthly: null,
    razorpayPlanIdYearly: null,
    limits: {
      queriesPerDay: -1,
      csvMaxSizeMB: 500,
      savedDashboards: -1,
      aiChatMessages: -1,
    },
    features: [
      'Unlimited AI queries',
      'CSV upload up to 500MB',
      'Everything in Pro',
      'Unlimited AI chat messages',
      'Team collaboration',
      'API access',
      'Custom integrations',
      'Export to PNG, PDF & PPT',
      'Scheduled reports',
      'White-label options',
      'Dedicated account manager',
      'Priority 24/7 support',
    ],
  },
}

// Get plan config by id
export function getPlan(planId) {
  return PLANS[planId] || PLANS.free
}

// Get plan limits
export function getPlanLimits(planId) {
  return getPlan(planId).limits
}

// Check if user can make a query (returns { allowed, remaining, limit, reason })
export function checkQueryQuota(usage, planId) {
  const plan = getPlan(planId)
  const limit = plan.limits.queriesPerDay

  // Unlimited
  if (limit === -1) {
    return { allowed: true, remaining: -1, limit: -1 }
  }

  const todayCount = usage?.today_count || 0

  if (todayCount >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      reason: `You've used all ${limit} queries for today. Upgrade to Pro for ${PLANS.pro.limits.queriesPerDay} queries/day.`
    }
  }

  return {
    allowed: true,
    remaining: limit - todayCount,
    limit
  }
}

// Check CSV file size against plan
export function checkFileSizeQuota(fileSizeMB, planId) {
  const plan = getPlan(planId)
  const limit = plan.limits.csvMaxSizeMB

  if (fileSizeMB > limit) {
    return {
      allowed: false,
      limit,
      reason: `File size (${fileSizeMB.toFixed(1)}MB) exceeds your ${plan.name} plan limit of ${limit}MB. Upgrade for larger files.`
    }
  }

  return { allowed: true, limit }
}

// Check saved dashboards limit
export function checkDashboardQuota(currentCount, planId) {
  const plan = getPlan(planId)
  const limit = plan.limits.savedDashboards

  if (limit === -1) return { allowed: true, remaining: -1, limit: -1 }

  if (currentCount >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      reason: `You've reached the ${limit} saved dashboard limit. Upgrade for unlimited dashboards.`
    }
  }

  return { allowed: true, remaining: limit - currentCount, limit }
}

// Format price for display
export function formatPrice(amount, currency = 'INR') {
  if (amount === 0) return 'Free'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
