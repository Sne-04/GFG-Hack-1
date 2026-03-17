import { Download } from 'lucide-react'
import html2canvas from 'html2canvas'

export default function Header({ title, subtitle, onExport }) {
  const handleExport = async () => {
    const el = document.getElementById('dashboard-content')
    if (!el) return
    try {
      const canvas = await html2canvas(el, { backgroundColor: '#0a0a0f', scale: 2 })
      const link = document.createElement('a')
      link.download = 'datamind-dashboard.png'
      link.href = canvas.toDataURL()
      link.click()
    } catch (e) { console.error('Export failed', e) }
  }

  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h1 className="text-lg font-bold">{title || 'Dashboard'}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <button onClick={handleExport} className="glass rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5 hover:border-primary/30 transition-all glass-hover">
        <Download size={13}/>Export PNG
      </button>
    </div>
  )
}
