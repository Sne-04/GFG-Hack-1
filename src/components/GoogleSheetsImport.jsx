import { useState } from 'react'
import { Link2, Loader2, AlertCircle, Table2 } from 'lucide-react'

/**
 * GoogleSheetsImport — paste a Google Sheets share URL, get data as CSV
 * Requires the sheet to be set to "Anyone with the link can view"
 */
export default function GoogleSheetsImport({ onImport, darkMode }) {
  const [url, setUrl]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  const extractSheetId = (raw) => {
    const match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null
  }

  const handleImport = async () => {
    setError(null)
    const sheetId = extractSheetId(url.trim())
    if (!sheetId) {
      setError('Invalid URL. Paste the full Google Sheets share link.')
      return
    }
    setLoading(true)
    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`
      const response = await fetch(csvUrl)
      if (!response.ok) {
        throw new Error(
          response.status === 403 || response.status === 401
            ? 'Access denied. Set sharing to "Anyone with the link can view".'
            : `Could not fetch sheet (HTTP ${response.status}).`
        )
      }
      const text = await response.text()
      if (!text.trim() || text.trim() === ',') throw new Error('Spreadsheet is empty or has no data rows.')
      const fileName = `sheet_${sheetId.slice(0, 8)}.csv`
      const file = new File([text], fileName, { type: 'text/csv' })
      onImport(file)
      setUrl('')
    } catch (e) {
      setError(e.message || 'Import failed. Check the URL and sheet permissions.')
    }
    setLoading(false)
  }

  return (
    <div className="glass rounded-lg p-2.5 space-y-2">
      <div className="flex items-center gap-1.5">
        <Table2 size={10} className="text-primary" />
        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Google Sheets</span>
      </div>

      <input
        type="url"
        value={url}
        onChange={e => { setUrl(e.target.value); setError(null) }}
        onKeyDown={e => e.key === 'Enter' && !loading && url.trim() && handleImport()}
        placeholder="Paste Google Sheets URL..."
        className={`w-full text-[10px] rounded-md px-2.5 py-1.5 border outline-none focus:border-primary/50 transition-colors ${
          darkMode
            ? 'bg-black/40 border-white/10 text-slate-200 placeholder-slate-600'
            : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400'
        }`}
      />

      <button
        onClick={handleImport}
        disabled={loading || !url.trim()}
        className="w-full flex items-center justify-center gap-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 rounded-md py-1.5 text-[9px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading
          ? <><Loader2 size={9} className="animate-spin" />Importing…</>
          : <><Link2 size={9} />Import Sheet</>
        }
      </button>

      {error && (
        <div className="flex items-start gap-1.5">
          <AlertCircle size={9} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-[9px] text-red-400 leading-snug">{error}</p>
        </div>
      )}

      <p className="text-[8px] text-slate-600 leading-snug">
        Sheet must be set to &ldquo;Anyone with the link can view&rdquo;
      </p>
    </div>
  )
}
