// ── src/components/ui/Tooltip.jsx ────────────────────────
import { useState } from 'react'
import clsx from 'clsx'

export default function Tooltip({ children, content, position = 'top' }) {
  const [visible, setVisible] = useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <div
          className={clsx(
            'absolute z-50 px-2.5 py-1.5 text-xs font-medium text-white bg-slate-800 rounded-lg whitespace-nowrap pointer-events-none',
            'animate-in fade-in duration-150',
            positionClasses[position]
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}
