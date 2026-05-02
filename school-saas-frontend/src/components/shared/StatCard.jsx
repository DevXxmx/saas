// ── src/components/shared/StatCard.jsx ───────────────────
import clsx from 'clsx'

export default function StatCard({ title, value, icon: Icon, trend, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-primary-50 text-primary-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <div className="card flex items-start gap-4">
      <div className={clsx('rounded-xl p-3', colorMap[color])}>
        {Icon && <Icon className="h-6 w-6" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value ?? '—'}</p>
        {trend && (
          <p
            className={clsx(
              'text-xs font-medium mt-1',
              trend > 0 ? 'text-emerald-600' : 'text-red-500'
            )}
          >
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </p>
        )}
      </div>
    </div>
  )
}
