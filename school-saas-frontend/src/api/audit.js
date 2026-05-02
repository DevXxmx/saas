// ── src/api/audit.js ─────────────────────────────────────
import api from './axios'

export const getAuditLogs = (params) =>
  api.get('/api/v1/audit/logs/', { params })
