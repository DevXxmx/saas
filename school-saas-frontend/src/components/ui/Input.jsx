// ── src/components/ui/Input.jsx ──────────────────────────
import { forwardRef } from 'react'
import clsx from 'clsx'

const Input = forwardRef(function Input(
  { label, error, hint, required, prefix, suffix, className, id, ...props },
  ref
) {
  const inputId = id || props.name || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {typeof prefix === 'string' ? (
              <span className="text-sm">{prefix}</span>
            ) : (
              prefix
            )}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'block w-full rounded-lg text-sm transition-colors duration-150',
            'border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            error && 'border-red-400 focus:ring-red-500 focus:border-red-500',
            prefix && 'pl-10',
            suffix && 'pr-10',
            className
          )}
          {...props}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
            {typeof suffix === 'string' ? (
              <span className="text-sm">{suffix}</span>
            ) : (
              suffix
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
})

export default Input
