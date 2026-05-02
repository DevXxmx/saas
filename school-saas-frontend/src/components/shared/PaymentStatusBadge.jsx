// ── src/components/shared/PaymentStatusBadge.jsx ─────────

const statusConfig = {
  paid: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    label: 'Paid',
  },
  pending: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    label: 'Pending',
  },
  overdue: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    label: 'Overdue',
  },
}

export default function PaymentStatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pending
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full px-3 py-1 whitespace-nowrap ${config.bg} ${config.text}`}
      style={{ fontSize: '14px', lineHeight: '20px' }}
    >
      {config.label}
    </span>
  )
}
