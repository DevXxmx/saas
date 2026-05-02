// ── src/api/communications.js ────────────────────────────
import api from './axios'

export const sendBulkEmail = (data) =>
  api.post('/api/v1/emails/send/', data)

export const getEmailLogs = (params) =>
  api.get('/api/v1/emails/logs/', { params })

export const getEmailLog = (id) =>
  api.get(`/api/v1/emails/logs/${id}/`)

export const getNotifications = (params) =>
  api.get('/api/v1/notifications/', { params })

export const markRead = (id) =>
  api.patch(`/api/v1/notifications/${id}/`, { is_read: true })

export const markAllRead = () =>
  api.post('/api/v1/notifications/mark-all-read/')
