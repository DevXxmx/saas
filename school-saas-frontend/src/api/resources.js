// ── src/api/resources.js ─────────────────────────────────
import api from './axios'

export const getResources = (params) =>
  api.get('/api/v1/resources/', { params })

export const uploadResource = (data) =>
  api.post('/api/v1/resources/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const deleteResource = (id) =>
  api.delete(`/api/v1/resources/${id}/`)
