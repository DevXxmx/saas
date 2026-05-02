// ── src/components/ui/Avatar.jsx ─────────────────────────
import clsx from 'clsx'

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?'
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getColor(name) {
  if (!name) return 'hsl(220, 60%, 50%)'
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)
  return `hsl(${hue}, 55%, 45%)`
}

export default function Avatar({ src, name, size = 'md', className }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={clsx('rounded-full object-cover', sizeClasses[size], className)}
      />
    )
  }

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-semibold text-white shrink-0',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: getColor(name) }}
      title={name}
    >
      {getInitials(name)}
    </div>
  )
}
