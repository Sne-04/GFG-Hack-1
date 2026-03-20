import { useCallback } from 'react'
import { Upload, FileSpreadsheet } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { checkFileSizeQuota } from '../utils/quota'

export default function CSVUpload({ onUpload, compact = false }) {
  const { plan } = useAuth()

  const handleFile = useCallback((file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext !== 'csv') {
      alert('Please upload a .csv file')
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
        className="block border border-dashed border-white/10 rounded-lg p-3 text-center cursor-pointer hover:border-primary/40 transition-all group"
      >
        <Upload size={16} className="mx-auto mb-1 text-slate-500 group-hover:text-primary transition-colors"/>
        <span className="text-[10px] text-slate-500">Upload CSV</span>
        <input type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files?.[0])}/>
      </label>
    )
  }

  return (
    <label
      onDragOver={e => e.preventDefault()}
      onDrop={onDrop}
      className="block border-2 border-dashed border-white/10 rounded-2xl p-12 text-center cursor-pointer hover:border-primary/40 transition-all group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
      <Upload size={40} className="mx-auto mb-3 text-slate-500 group-hover:text-primary transition-colors animate-float"/>
      <h3 className="text-sm font-medium text-slate-300 mb-1">Drop your CSV file here</h3>
      <span className="text-xs text-slate-500">or click to browse</span>
      <input type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files?.[0])}/>
    </label>
  )
}
