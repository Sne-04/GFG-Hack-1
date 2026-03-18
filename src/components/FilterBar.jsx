import { Filter } from 'lucide-react'

export default function FilterBar({ filters, activeFilters, onChange }) {
  if (!filters?.length) return null
  return (
    <div className="flex items-center gap-3 flex-wrap bg-[#101018] p-3 rounded-2xl border border-white/5 shadow-md">
      <div className="flex items-center gap-2 text-slate-400 pl-2">
        <Filter size={14} className="text-primary/70" />
        <span className="text-[10px] uppercase tracking-widest font-bold">Global Filters</span>
      </div>
      <div className="w-px h-5 bg-white/10 mx-1 hidden md:block" />
      {filters.map(f => (
        <select
          key={f.column}
          value={activeFilters[f.column] || ''}
          onChange={e => onChange(f.column, e.target.value)}
          className="bg-[#1a1b26] border border-white/10 rounded-full px-4 py-1.5 text-xs text-slate-200 outline-none cursor-pointer hover:border-primary/50 transition-all focus:ring-1 focus:ring-primary/50 appearance-none shadow-sm font-medium"
          style={{ 
            backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="none" stroke="%2394a3b8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>')`, 
            backgroundRepeat: 'no-repeat', 
            backgroundPosition: 'right 0.75rem center', 
            backgroundSize: '1em', 
            paddingRight: '2.5rem' 
          }}
        >
          <option value="" className="bg-[#0f0f18] text-slate-400 font-medium">Any {f.column}</option>
          {f.values.map(v => <option key={v} value={v} className="bg-[#0f0f18] text-slate-200">{v}</option>)}
        </select>
      ))}
    </div>
  )
}
