import { useCallback } from 'react'
import { Upload, FileSpreadsheet } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { checkFileSizeQuota } from '../utils/quota'

export default function CSVUpload({ onUpload, compact = false }) {
  const { plan } = useAuth()

  const handleFile = useCallback((file) => {
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
    onUpload(file)
  }, [onUpload, plan])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    const file = e.dataTransfer?.files?.[0]
    handleFile(file)
  }, [handleFile])

  if (compact) {
    return (
      <label
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
        className="block border border-dashed border-slate-300 bg-slate-50/50 rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
      >
        <Upload size={16} className="mx-auto mb-1 text-slate-400 group-hover:text-primary transition-colors"/>
        <span className="text-[10px] text-slate-600 font-medium">CSV / Excel</span>
        <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => handleFile(e.target.files?.[0])}/>
      </label>
    )
  }

  return (
    <label
      onDragOver={e => e.preventDefault()}
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
      <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => handleFile(e.target.files?.[0])}/>
    </label>
  )
}
