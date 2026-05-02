// ── src/components/shared/NotificationBell.jsx ───────────
import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useNotificationStore } from '@/store/notificationStore'
import { useNotifications, useMarkRead, useMarkAllRead } from '@/hooks/useCommunications'
import Drawer from '@/components/ui/Drawer'
import Button from '@/components/ui/Button'
import { formatTimeAgo } from '@/utils/formatters'
import clsx from 'clsx'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const notifications = useNotificationStore((s) => s.notifications)
  const { refetch } = useNotifications({ page_size: 20 })
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()

  const handleOpen = () => {
    setOpen(true)
    refetch()
  }

  const handleMarkRead = (id) => {
    markRead.mutate(id)
  }

  const handleMarkAllRead = () => {
    markAllRead.mutate()
  }

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-5 w-5 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} title="Notifications" side="right" width="sm">
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead} loading={markAllRead.isPending}>
            Mark all read
          </Button>
        </div>

        <div className="space-y-1">
          {(!notifications || notifications.length === 0) && (
            <p className="text-sm text-slate-500 text-center py-8">No notifications</p>
          )}
          {notifications?.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
              className={clsx(
                'w-full text-left p-3 rounded-lg transition-colors',
                n.is_read ? 'bg-white hover:bg-slate-50' : 'bg-primary-50 hover:bg-primary-100'
              )}
            >
              <div className="flex items-start gap-2">
                {!n.is_read && (
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-primary-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className={clsx(
                      'text-sm',
                      n.is_read ? 'text-slate-600' : 'text-slate-900 font-semibold'
                    )}
                  >
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {formatTimeAgo(n.created_at)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Drawer>
    </>
  )
}
