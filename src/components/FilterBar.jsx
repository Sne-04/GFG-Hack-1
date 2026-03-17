export default function FilterBar({ filters, activeFilters, onChange }) {
  if (!filters?.length) return null
  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map(f => (
        <select
          key={f.column}
          value={activeFilters[f.column] || ''}
          onChange={e => onChange(f.column, e.target.value)}
          className="glass rounded-lg px-3 py-1.5 text-xs text-slate-300 bg-transparent border-none outline-none cursor-pointer hover:border-primary/30 transition-all focus:ring-1 focus:ring-primary/30"
        >
          <option value="" className="bg-[#0f0f18]">{f.column}</option>
          {f.values.map(v => <option key={v} value={v} className="bg-[#0f0f18]">{v}</option>)}
        </select>
      ))}
    </div>
  )
}
