// ── src/store/notificationStore.js ───────────────────────
import { create } from 'zustand'

export const useNotificationStore = create((set) => ({
  unreadCount: 0,
  notifications: [],

  setNotifications: (list) => {
    const unread = Array.isArray(list) ? list.filter((n) => !n.is_read).length : 0
    set({ notifications: list, unreadCount: unread })
  },

  decrementUnread: () =>
    set((state) => ({
      unreadCount: state.unreadCount > 0 ? state.unreadCount - 1 : 0,
    })),

  resetUnread: () => set({ unreadCount: 0 }),
}))
