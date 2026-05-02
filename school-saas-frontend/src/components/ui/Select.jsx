// ── src/components/ui/Select.jsx ─────────────────────────
import { forwardRef } from 'react'
import clsx from 'clsx'

const Select = forwardRef(function Select(
  { label, error, options = [], placeholder, required, className, id, ...props },
  ref
) {
  const selectId = id || props.name || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={clsx(label ? 'w-full' : 'min-w-[140px]')}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={clsx(
          'block w-full rounded-lg text-sm transition-colors duration-150',
          'border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          error && 'border-red-400 focus:ring-red-500 focus:border-red-500',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
})

export default Select
