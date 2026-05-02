// ── src/components/ui/SearchInput.jsx ────────────────────
import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import clsx from 'clsx'

export default function SearchInput({
  value: externalValue,
  onChange,
  placeholder = 'Search...',
  debounceMs = 400,
  className,
}) {
  const [internal, setInternal] = useState(externalValue || '')
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (externalValue !== undefined && externalValue !== internal) {
      setInternal(externalValue)
    }
  }, [externalValue])

  useEffect(() => {
    // Skip the initial mount to avoid an extra API call
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const timer = setTimeout(() => {
      onChange?.(internal)
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [internal, debounceMs])

  return (
    <div className={clsx('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <input
        type="text"
        value={internal}
        onChange={(e) => setInternal(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-10 pr-9 py-2 text-sm rounded-lg border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
      />
      {internal && (
        <button
          type="button"
          onClick={() => {
            setInternal('')
            onChange?.('')
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
