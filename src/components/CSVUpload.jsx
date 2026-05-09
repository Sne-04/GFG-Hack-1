import { useCallback, useRef } from 'react'
import { Upload } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { checkFileSizeQuota } from '../utils/quota'

/**
 * CSVUpload — bulletproof file reader.
 *
 * The macOS Chrome bug: drag-and-drop File references get revoked after
 * the drop event handler returns. ANY async gap (even a microtask from
 * an async function) can cause FileReader to fail with NotReadableError.
 *
 * FIX: Call FileReader.readAsText() / readAsArrayBuffer() DIRECTLY inside
 * the synchronous drop/change event handler — no async wrapper, no await,
 * no intermediate function calls that could yield.
 */
export default function CSVUpload({ onUpload, compact = false }) {
  const { plan } = useAuth()
  const fileInputRef = useRef(null)

  /**
   * Core reader: validates, then starts FileReader synchronously.
   * MUST be called directly from the event handler (drop / change).
   */
  const ingestFile = useCallback((file) => {
    if (!file) return

    const ext = file.name.split('.').pop().toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      alert('Please upload a .csv, .xlsx, or .xls file')
      return
    }

    const fileSizeMB = file.size / (1024 * 1024)
    const sizeCheck = checkFileSizeQuota(fileSizeMB, plan || 'free')
    if (!sizeCheck.allowed) {
      alert(sizeCheck.reason)
      return
    }

    const fileName = file.name

    // ── Excel files → read as ArrayBuffer ──
    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader()
      reader.onload = () => {
        onUpload({ name: fileName, ext, buffer: reader.result })
      }
      reader.onerror = () => {
        console.error('FileReader.readAsArrayBuffer failed for', fileName)
        onUpload({ name: fileName, ext, error: 'Could not read this file. Try a different browser or re-save the file.' })
      }
      reader.readAsArrayBuffer(file) // SYNCHRONOUS call — starts read immediately
      return
    }

    // ── CSV files → read as Text ──
    const reader = new FileReader()
    reader.onload = () => {
      onUpload({ name: fileName, ext, text: reader.result })
    }
    reader.onerror = () => {
      console.error('FileReader.readAsText failed for', fileName)
      onUpload({ name: fileName, ext, error: 'Could not read this file. Try a different browser or re-save the file.' })
    }
    reader.readAsText(file) // SYNCHRONOUS call — starts read immediately
  }, [onUpload, plan])

  // ── Drop handler ──
  const onDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer?.files?.[0]
    ingestFile(file) // Synchronous — FileReader starts before handler returns
  }, [ingestFile])

  // ── File picker handler ──
  const onChange = useCallback((e) => {
    const file = e.target.files?.[0]
    ingestFile(file) // Synchronous — FileReader starts before handler returns
    // Reset so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [ingestFile])

  if (compact) {
    return (
      <label
        onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
        onDrop={onDrop}
        className="block border border-dashed border-slate-300 bg-slate-50/50 rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
      >
        <Upload size={16} className="mx-auto mb-1 text-slate-400 group-hover:text-primary transition-colors"/>
        <span className="text-[10px] text-slate-600 font-medium">CSV / Excel</span>
        <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onChange}/>
      </label>
    )
  }

  return (
    <label
      onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
      onDrop={onDrop}
      className="block border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group relative overflow-hidden shadow-sm"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
      <Upload size={36} className="mx-auto mb-4 text-slate-400 group-hover:text-primary transition-colors animate-float"/>
      <h3 className="text-[15px] font-semibold text-slate-700 mb-1.5">Drop your dataset here</h3>
      <span className="text-[11px] text-slate-500 font-medium">or click to browse • .csv, .xlsx, .xls</span>
      <p className="text-[10px] text-slate-400 mt-3 font-medium">
        Max size: {plan === 'enterprise' ? '500MB' : plan === 'pro' ? '100MB' : '10MB'}
        {plan === 'free' && <a href="/pricing" className="text-primary ml-1 hover:underline font-semibold">Upgrade for larger files →</a>}
      </p>
      <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onChange}/>
    </label>
  )
}
