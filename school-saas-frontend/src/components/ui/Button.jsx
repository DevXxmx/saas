// ── src/components/ui/Button.jsx ─────────────────────────
import clsx from 'clsx'
import Spinner from './Spinner'

const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm',
  secondary:
    'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-primary-500 shadow-sm',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
  ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-500',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  children,
  className,
  type = 'button',
  ...rest
}) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2',
        variants[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...rest}
    >
      {loading ? (
        <Spinner size="sm" color={variant === 'primary' || variant === 'danger' ? 'text-white' : 'text-slate-600'} />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className={clsx(size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4')} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className={clsx(size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4')} />}
        </>
      )}
    </button>
  )
}
