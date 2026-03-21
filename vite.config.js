import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // Load ALL env vars (not just VITE_ prefixed) so plugins can use OPENAI_API_KEY etc.
  const env = loadEnv(mode, process.cwd(), '')

  // Dev-only middleware: handles /api/* routes locally so queries + coupons work without Vercel CLI
  function localApiPlugin() {
    return {
      name: 'local-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url.startsWith('/api/')) return next()

          // /api/chat — forward to OpenAI directly using the server-side API key
          if (req.url === '/api/chat') {
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', async () => {
              try {
                const apiKey = env.OPENAI_API_KEY
                if (!apiKey || apiKey === 'your_openai_api_key_here') {
                  res.writeHead(500, { 'Content-Type': 'application/json' })
                  return res.end(JSON.stringify({ error: { message: 'OPENAI_API_KEY not set in .env' } }))
                }
                const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                  body,
                })
                const data = await oaiRes.json()
                res.writeHead(oaiRes.status, { 'Content-Type': 'application/json' })
                return res.end(JSON.stringify(data))
              } catch (err) {
                console.error('[local-api/chat]', err)
                res.writeHead(500, { 'Content-Type': 'application/json' })
                return res.end(JSON.stringify({ error: { message: 'Local API error: ' + err.message } }))
              }
            })
            return
          }

          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', async () => {
            try {
              const parsed = body ? JSON.parse(body) : {}

              // ── /api/validate-coupon ──────────────────────────────
              if (req.url === '/api/validate-coupon') {
                const { validateCoupon } = await import('./api/coupons.js')
                const PRICES = {
                  pro: { monthly: 499, yearly: 4999 },
                  enterprise: { monthly: 2999, yearly: 29999 },
                }
                const { code, plan, billing = 'monthly' } = parsed
                const result = validateCoupon(code, plan)
                if (!result.valid) {
                  res.writeHead(400, { 'Content-Type': 'application/json' })
                  return res.end(JSON.stringify({ error: result.error }))
                }
                const basePrice = PRICES[plan]?.[billing] ?? 0
                const discountAmount = Math.floor(basePrice * result.discount / 100)
                const finalPrice = basePrice - discountAmount
                res.writeHead(200, { 'Content-Type': 'application/json' })
                return res.end(JSON.stringify({
                  valid: true,
                  code: code.trim().toUpperCase(),
                  discount: result.discount,
                  label: result.label,
                  isFree: finalPrice === 0,
                  originalPrice: basePrice,
                  discountAmount,
                  finalPrice,
                }))
              }

              // ── /api/razorpay-order ───────────────────────────────
              if (req.url === '/api/razorpay-order') {
                const { validateCoupon } = await import('./api/coupons.js')
                const { plan, billing, couponCode } = parsed
                const prices = {
                  pro: { monthly: 49900, yearly: 499900 },
                  enterprise: { monthly: 299900, yearly: 2999900 },
                }
                let amount = prices[plan]?.[billing] ?? 0
                if (couponCode) {
                  const coupon = validateCoupon(couponCode, plan)
                  if (coupon.valid) {
                    amount -= Math.floor(amount * coupon.discount / 100)
                    if (amount === 0) {
                      res.writeHead(200, { 'Content-Type': 'application/json' })
                      return res.end(JSON.stringify({ free: true, plan, billing, couponCode }))
                    }
                  }
                }
                // Return mock order (no real Razorpay key in dev)
                res.writeHead(200, { 'Content-Type': 'application/json' })
                return res.end(JSON.stringify({
                  orderId: 'dev_order_' + Date.now(),
                  amount,
                  currency: 'INR',
                  keyId: env.RAZORPAY_KEY_ID || 'rzp_test_dev',
                }))
              }

              // ── /api/razorpay-verify ──────────────────────────────
              if (req.url === '/api/razorpay-verify') {
                const { validateCoupon } = await import('./api/coupons.js')
                const { freeActivation, couponCode, plan, billing } = parsed
                if (freeActivation && couponCode) {
                  const coupon = validateCoupon(couponCode, plan)
                  if (!coupon.valid || !coupon.isFree) {
                    res.writeHead(400, { 'Content-Type': 'application/json' })
                    return res.end(JSON.stringify({ error: 'Invalid free activation coupon' }))
                  }
                  // In dev: skip Supabase update, just confirm success
                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  return res.end(JSON.stringify({ success: true, plan, billing, message: 'Dev: plan activated free' }))
                }
                // Normal verify (dev mock)
                res.writeHead(200, { 'Content-Type': 'application/json' })
                return res.end(JSON.stringify({ success: true, plan, billing }))
              }

              next()
            } catch (err) {
              console.error('[local-api]', err)
              next()
            }
          })
        })
      }
    }
  }

  return {
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/utils/__tests__/setup.js'],
    },
    plugins: [
      react(),
      localApiPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          name: 'DataMind AI',
          short_name: 'DataMind',
          description: 'AI-Powered Business Intelligence Dashboard',
          theme_color: '#0a0a0f',
          background_color: '#0a0a0f',
          display: 'standalone',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
          ]
        }
      })
    ],
    server: {}
  }
})
