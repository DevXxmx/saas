// ── src/components/shared/FilterBar.jsx ──────────────────
export default function FilterBar({ children }) {
  return (
    <div className="flex flex-wrap items-end gap-3 p-4 bg-white rounded-lg border border-slate-100 shadow-card">
      {children}
    </div>
  )
}
