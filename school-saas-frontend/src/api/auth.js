// ── src/api/auth.js ──────────────────────────────────────
import api from './axios'

export const login = (email, password) =>
  api.post('/api/v1/auth/login/', { email, password })

export const logout = (refresh) =>
  api.post('/api/v1/auth/logout/', { refresh })

export const getMe = () =>
  api.get('/api/v1/auth/me/')

export const updateMe = (data) =>
  api.patch('/api/v1/auth/me/', data)

export const changePassword = (data) =>
  api.post('/api/v1/auth/change-password/', data)
