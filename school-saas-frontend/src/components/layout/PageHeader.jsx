// ── src/components/layout/PageHeader.jsx ─────────────────
import Button from '@/components/ui/Button'

export default function PageHeader({ title, subtitle, actions = [] }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions.length > 0 && (
        <div className="flex items-center gap-3">
          {actions.map((action, i) => (
            <Button key={i} {...action}>
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
