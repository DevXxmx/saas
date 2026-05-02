// ── src/components/ui/Drawer.jsx ─────────────────────────
import { Fragment } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { X } from 'lucide-react'
import clsx from 'clsx'

const widthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export default function Drawer({ open, onClose, title, side = 'right', width = 'md', children }) {
  const isRight = side === 'right'

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className={clsx('absolute inset-y-0 flex', isRight ? 'right-0' : 'left-0')}>
            <TransitionChild
              as={Fragment}
              enter="transform transition ease-out duration-300"
              enterFrom={isRight ? 'translate-x-full' : '-translate-x-full'}
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-200"
              leaveFrom="translate-x-0"
              leaveTo={isRight ? 'translate-x-full' : '-translate-x-full'}
            >
              <DialogPanel
                className={clsx(
                  'w-screen bg-white shadow-xl flex flex-col h-full',
                  widthClasses[width]
                )}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                  {title && (
                    <DialogTitle className="text-lg font-semibold text-slate-900">
                      {title}
                    </DialogTitle>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
