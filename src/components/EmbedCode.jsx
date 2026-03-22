import { useState } from 'react'
import { X, Copy, Check, Code2, ExternalLink } from 'lucide-react'

const SIZES = [
  { label: '800×600',    w: '800',  h: '600' },
  { label: '1200×700',   w: '1200', h: '700' },
  { label: 'Full Width', w: '100%', h: '600' },
]

/**
 * EmbedCode — modal that shows <iframe> embed code for a saved dashboard
 * dashboardId: Supabase dashboard UUID (null = not saved yet)
 */
export default function EmbedCode({ dashboardId, darkMode, onClose }) {
  const [copied, setCopied]   = useState(false)
  const [sizeIdx, setSizeIdx] = useState(0)

  const base     = typeof window !== 'undefined' ? window.location.origin : 'https://datamind.ai'
  const shareUrl = dashboardId ? `${base}/shared/${dashboardId}` : `${base}/dashboard`
  const { w, h } = SIZES[sizeIdx]

  const iframeCode = [
    `<iframe`,
    `  src="${shareUrl}"`,
    `  width="${w}"`,
    `  height="${h}"`,
    `  frameborder="0"`,
    `  style="border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.15)"`,
    `  allowfullscreen`,
    `></iframe>`,
  ].join('\n')

  const copyCode = () => {
    navigator.clipboard.writeText(iframeCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl border ${darkMode ? 'bg-[#0e0e1a] border-white/10' : 'bg-white border-slate-200'}`}>

        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <Code2 size={16} className="text-primary" />
            <span className="font-bold text-sm">Embed Dashboard</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Size Selector */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Frame Size</p>
            <div className="flex gap-2">
              {SIZES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setSizeIdx(i)}
                  className={`text-[10px] px-3 py-1.5 rounded-lg border font-medium transition-all ${
                    sizeIdx === i
                      ? 'bg-primary/20 border-primary/40 text-primary'
                      : darkMode
                        ? 'border-white/10 text-slate-400 hover:border-white/20'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Embed Code */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Embed Code</p>
            <div className={`relative rounded-xl border font-mono text-[10px] p-4 overflow-x-auto leading-relaxed ${
              darkMode ? 'bg-black/40 border-white/10 text-emerald-300' : 'bg-slate-50 border-slate-200 text-emerald-700'
            }`}>
              <pre className="whitespace-pre-wrap break-all">{iframeCode}</pre>
            </div>
          </div>

          {/* Share Link */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Share Link</p>
            <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
              darkMode ? 'border-white/10 bg-black/30' : 'border-slate-200 bg-slate-50'
            }`}>
              <span className="text-[10px] text-slate-400 flex-1 truncate">{shareUrl}</span>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors shrink-0"
                title="Open in new tab"
              >
                <ExternalLink size={12} />
              </a>
            </div>
            {!dashboardId && (
              <p className="text-[9px] text-amber-400 mt-1.5">
                Save the dashboard first to get a permanent shareable link.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`flex gap-2 p-5 border-t ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
          <button
            onClick={copyCode}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/80 text-white rounded-xl py-2.5 text-xs font-semibold transition-all"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Embed Code'}
          </button>
          <button
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl text-xs font-medium border transition-all ${
              darkMode ? 'border-white/10 text-slate-400 hover:border-white/20' : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
