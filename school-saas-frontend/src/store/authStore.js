// ── src/store/authStore.js ───────────────────────────────
import { create } from 'zustand'
import { getMe } from '@/api/auth'

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setTokens: (access, refresh) => {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    set({ accessToken: access, refreshToken: refresh })
  },

  setUser: (user) => {
    set({ user, isAuthenticated: true, isLoading: false })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  initialize: async () => {
    const access = localStorage.getItem('access_token')
    const refresh = localStorage.getItem('refresh_token')
    if (!access || !refresh) {
      set({ isLoading: false })
      return
    }
    set({ accessToken: access, refreshToken: refresh })
    try {
      const { data } = await getMe()
      set({ user: data, isAuthenticated: true, isLoading: false })
    } catch {
      get().logout()
    }
  },
}))
