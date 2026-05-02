// ── src/components/ui/Pagination.jsx ─────────────────────
import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page = 1, pageSize = 10, total = 0, onPageChange }) {
  const totalPages = Math.ceil(total / pageSize) || 1
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, page - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <p className="text-sm text-slate-600">
        Showing <span className="font-medium">{from}</span>–
        <span className="font-medium">{to}</span> of{' '}
        <span className="font-medium">{total}</span> results
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={clsx(
            'p-2 rounded-lg text-sm transition-colors',
            page <= 1
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {getPageNumbers().map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={clsx(
              'h-8 w-8 rounded-lg text-sm font-medium transition-colors',
              p === page
                ? 'bg-primary-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={clsx(
            'p-2 rounded-lg text-sm transition-colors',
            page >= totalPages
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-100'
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
