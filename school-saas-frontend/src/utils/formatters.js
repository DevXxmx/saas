// ── src/utils/formatters.js ─────────────────────────────
import { format, parseISO, formatDistanceToNow } from 'date-fns'

export const formatDate = (iso) => {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), 'MMM d, yyyy')
  } catch {
    return '—'
  }
}

export const formatDateTime = (iso) => {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), 'MMM d, yyyy · HH:mm')
  } catch {
    return '—'
  }
}

export const formatTimeAgo = (iso) => {
  if (!iso) return '—'
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true })
  } catch {
    return '—'
  }
}

export const formatGPA = (grades) => {
  if (!grades || !grades.length) return 'N/A'
  // Exclude ungraded rows (mark === null/undefined)
  const graded = grades.filter(
    (g) => g.mark !== null && g.mark !== undefined && !isNaN(parseFloat(g.mark))
  )
  if (!graded.length) return 'N/A'
  const avg = graded.reduce((s, g) => s + parseFloat(g.mark), 0) / graded.length
  return avg.toFixed(2)
}

export const gradeColor = (letter) =>
  ({
    'A+': 'success',
    A: 'success',
    'B+': 'info',
    B: 'info',
    'C+': 'warning',
    C: 'warning',
    D: 'warning',
    F: 'danger',
  })[letter] || 'neutral'

export const formatCurrency = (amount, currency = 'USD') => {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}
