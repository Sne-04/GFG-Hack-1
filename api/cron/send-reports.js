import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
}

function calcNextSendAt(frequency, dayOfWeek, dayOfMonth) {
  const now = new Date()
  const next = new Date(now)
  if (frequency === 'weekly') {
    const day = dayOfWeek ?? 1
    const diff = (day - now.getDay() + 7) % 7 || 7
    next.setDate(now.getDate() + diff)
    next.setHours(8, 0, 0, 0)
  } else {
    const dom = dayOfMonth ?? 1
    next.setDate(dom)
    if (next <= now) next.setMonth(next.getMonth() + 1)
    next.setHours(8, 0, 0, 0)
  }
  return next.toISOString()
}

function buildEmailHtml(dashboard, schedule) {
  const result = dashboard.result_json || {}
  const kpis = result.kpis || []
  const insights = result.insights || []
  const query = dashboard.query_text || 'Dashboard Report'
  const dashboardName = dashboard.title || dashboard.csv_name || 'Untitled Dashboard'
  const base = process.env.VITE_APP_URL || 'https://app.datamind.ai'
  const dashboardUrl = `${base}/dashboards`

  const kpiRows = kpis.slice(0, 4).map(k => `
    <td style="padding:12px 16px;text-align:center;background:#f8fafc;border-radius:8px;margin:4px">
      <div style="font-size:22px;font-weight:700;color:#4f46e5">${k.value}</div>
      <div style="font-size:11px;color:#64748b;margin-top:2px">${k.label}</div>
    </td>`).join('')

  const insightItems = insights.slice(0, 3).map(i => `
    <li style="padding:6px 0;color:#475569;font-size:13px;border-bottom:1px solid #f1f5f9">
      ${typeof i === 'string' ? i : i.text || ''}
    </li>`).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px">
      <div style="color:#fff;font-size:22px;font-weight:700">DataMind AI</div>
      <div style="color:#c4b5fd;font-size:13px;margin-top:4px">Your ${schedule.frequency} report is ready</div>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px">
      <h2 style="margin:0 0 6px;font-size:18px;color:#0f172a">${dashboardName}</h2>
      <p style="margin:0 0 20px;font-size:13px;color:#64748b">${query}</p>

      ${kpis.length ? `
      <!-- KPIs -->
      <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:10px">Key Metrics</p>
      <table width="100%" cellpadding="4" cellspacing="0" style="margin-bottom:24px">
        <tr>${kpiRows}</tr>
      </table>` : ''}

      ${insights.length ? `
      <!-- Insights -->
      <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:8px">AI Insights</p>
      <ul style="margin:0 0 24px;padding-left:16px;list-style:none">${insightItems}</ul>` : ''}

      <!-- CTA -->
      <a href="${dashboardUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:13px;font-weight:600">
        View Full Dashboard →
      </a>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid #f1f5f9;background:#f8fafc">
      <p style="margin:0;font-size:11px;color:#94a3b8">
        You're receiving this because you set up a ${schedule.frequency} report in DataMind AI.
        <br>To stop these emails, manage your reports in <a href="${base}/settings" style="color:#4f46e5">Settings</a>.
      </p>
    </div>
  </div>
</body>
</html>`
}

export default async function handler(req, res) {
  // Vercel Cron calls with GET; also allow POST for manual testing
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify cron secret to prevent unauthorized triggers
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers['authorization']
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.error('[cron/send-reports] RESEND_API_KEY not configured')
    return res.status(500).json({ error: 'Email service not configured' })
  }

  const supabase = getServiceClient()
  const resend = new Resend(resendKey)
  const now = new Date().toISOString()

  // Find all due, active reports
  const { data: dueReports, error: fetchErr } = await supabase
    .from('scheduled_reports')
    .select('*, dashboards(id, title, csv_name, query_text, result_json)')
    .eq('is_active', true)
    .lte('next_send_at', now)
    .limit(50)

  if (fetchErr) {
    console.error('[cron/send-reports] Fetch error:', fetchErr.message)
    return res.status(500).json({ error: fetchErr.message })
  }

  if (!dueReports?.length) {
    return res.status(200).json({ sent: 0, message: 'No reports due' })
  }

  let sent = 0
  let failed = 0

  for (const schedule of dueReports) {
    const dashboard = schedule.dashboards
    if (!dashboard) {
      console.warn(`[cron/send-reports] Dashboard not found for schedule ${schedule.id}`)
      continue
    }

    try {
      const dashboardName = dashboard.title || dashboard.csv_name || 'Untitled Dashboard'
      const html = buildEmailHtml(dashboard, schedule)

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'reports@datamind.ai',
        to: schedule.recipient_email,
        subject: `📊 Your ${schedule.frequency} report: ${dashboardName}`,
        html,
      })

      // Update last_sent_at and next_send_at
      const next = calcNextSendAt(schedule.frequency, schedule.day_of_week, schedule.day_of_month)
      await supabase
        .from('scheduled_reports')
        .update({ last_sent_at: now, next_send_at: next })
        .eq('id', schedule.id)

      console.log(`[cron/send-reports] Sent to ${schedule.recipient_email} for dashboard ${dashboard.id}`)
      sent++
    } catch (err) {
      console.error(`[cron/send-reports] Failed for schedule ${schedule.id}:`, err.message)
      failed++
    }
  }

  return res.status(200).json({ sent, failed, total: dueReports.length })
}
