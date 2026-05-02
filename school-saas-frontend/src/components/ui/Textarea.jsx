// ── src/components/ui/Textarea.jsx ───────────────────────
import { forwardRef } from 'react'
import clsx from 'clsx'

const Textarea = forwardRef(function Textarea(
  { label, error, hint, rows = 4, required, className, id, ...props },
  ref
) {
  const textareaId = id || props.name || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={clsx(
          'block w-full rounded-lg text-sm transition-colors duration-150',
          'border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          error && 'border-red-400 focus:ring-red-500 focus:border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
})

export default Textarea
