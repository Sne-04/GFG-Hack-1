import { useState, useEffect } from 'react'
import { X, Clock, Mail, Calendar, Trash2, Plus, Check, AlertCircle } from 'lucide-react'
import { supabase } from '../utils/supabase'

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * ScheduleReport — modal for managing email report schedules for a saved dashboard
 * Props:
 *   dashboardId: string (Supabase dashboard UUID)
 *   darkMode: boolean
 *   userEmail: string (pre-fill recipient)
 *   onClose: () => void
 */
export default function ScheduleReport({ dashboardId, darkMode, userEmail, onClose }) {
  const [schedules, setSchedules]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')
  const [showForm, setShowForm]     = useState(false)

  const [email, setEmail]           = useState(userEmail || '')
  const [frequency, setFrequency]   = useState('weekly')
  const [dayOfWeek, setDayOfWeek]   = useState(1)   // Monday
  const [dayOfMonth, setDayOfMonth] = useState(1)

  useEffect(() => { loadSchedules() }, [dashboardId])

  async function loadSchedules() {
    setLoading(true)
    try {
      const session = await supabase.auth.getSession()
      const token = session?.data?.session?.access_token
      const res = await fetch(`/api/schedule-report?dashboard_id=${dashboardId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      setSchedules(json.schedules || [])
    } catch {
      setError('Failed to load schedules')
    } finally {
      setLoading(false)
    }
  }

  async function createSchedule(e) {
    e.preventDefault()
    if (!email.trim()) return setError('Email is required')
    setSaving(true)
    setError('')
    try {
      const session = await supabase.auth.getSession()
      const token = session?.data?.session?.access_token
      const body = {
        dashboard_id: dashboardId,
        recipient_email: email.trim(),
        frequency,
        day_of_week: frequency === 'weekly' ? dayOfWeek : null,
        day_of_month: frequency === 'monthly' ? dayOfMonth : null,
      }
      const res = await fetch('/api/schedule-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create schedule')
      setSchedules(prev => [json.schedule, ...prev])
      setShowForm(false)
      setSuccess('Report scheduled!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteSchedule(id) {
    try {
      const session = await supabase.auth.getSession()
      const token = session?.data?.session?.access_token
      await fetch(`/api/schedule-report?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setSchedules(prev => prev.filter(s => s.id !== id))
    } catch {
      setError('Failed to delete schedule')
    }
  }

  const border = darkMode ? 'border-white/10' : 'border-slate-200'
  const bg     = darkMode ? 'bg-[#0e0e1a]' : 'bg-white'
  const inputCls = `w-full px-3 py-2 rounded-lg border text-xs outline-none transition-all ${
    darkMode
      ? 'bg-black/30 border-white/10 text-white placeholder-slate-500 focus:border-primary/50'
      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-primary/50'
  }`

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full max-w-md rounded-2xl shadow-2xl border ${bg} ${border}`}>

        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${border}`}>
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-primary" />
            <span className="font-bold text-sm">Scheduled Reports</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Feedback */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400">
              <AlertCircle size={13} /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-400">
              <Check size={13} /> {success}
            </div>
          )}

          {/* Existing Schedules */}
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : schedules.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Active Schedules</p>
              {schedules.map(s => (
                <div key={s.id} className={`flex items-center justify-between p-3 rounded-lg border ${border} ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <Mail size={11} className="text-primary" />
                      {s.recipient_email}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {s.frequency === 'weekly'
                        ? `Every ${DAYS_OF_WEEK[s.day_of_week ?? 1]}`
                        : `Monthly on day ${s.day_of_month ?? 1}`}
                      {s.last_sent_at && ` · Last sent ${new Date(s.last_sent_at).toLocaleDateString()}`}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSchedule(s.id)}
                    className="text-slate-400 hover:text-red-400 transition-colors p-1"
                    title="Delete schedule"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          ) : !showForm ? (
            <p className="text-xs text-slate-500 text-center py-4">No schedules yet.</p>
          ) : null}

          {/* Add Schedule Form */}
          {showForm ? (
            <form onSubmit={createSchedule} className="space-y-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">New Schedule</p>

              {/* Email */}
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Recipient Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputCls}
                  required
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Frequency</label>
                <div className="flex gap-2">
                  {['weekly', 'monthly'].map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFrequency(f)}
                      className={`flex-1 text-[10px] py-1.5 rounded-lg border font-medium transition-all capitalize ${
                        frequency === f
                          ? 'bg-primary/20 border-primary/40 text-primary'
                          : darkMode
                            ? 'border-white/10 text-slate-400 hover:border-white/20'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day selector */}
              {frequency === 'weekly' ? (
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Day of Week</label>
                  <select
                    value={dayOfWeek}
                    onChange={e => setDayOfWeek(Number(e.target.value))}
                    className={inputCls}
                  >
                    {DAYS_OF_WEEK.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">Day of Month</label>
                  <select
                    value={dayOfMonth}
                    onChange={e => setDayOfMonth(Number(e.target.value))}
                    className={inputCls}
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/80 disabled:opacity-50 text-white rounded-xl py-2.5 text-xs font-semibold transition-all"
                >
                  {saving ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Calendar size={13} />}
                  {saving ? 'Saving...' : 'Schedule Report'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className={`px-4 rounded-xl text-xs font-medium border transition-all ${
                    darkMode ? 'border-white/10 text-slate-400 hover:border-white/20' : 'border-slate-200 text-slate-500'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                darkMode
                  ? 'border-white/10 text-slate-400 hover:border-primary/40 hover:text-primary'
                  : 'border-slate-200 text-slate-500 hover:border-primary/40 hover:text-primary'
              }`}
            >
              <Plus size={13} /> Add Schedule
            </button>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${border}`}>
          <p className="text-[10px] text-slate-500 text-center">
            Reports are sent as HTML emails with your dashboard data · Powered by Resend
          </p>
        </div>
      </div>
    </div>
  )
}
