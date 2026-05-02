// ── src/api/partners.js ──────────────────────────────────
import api from './axios'

export const getPartners = (params) =>
  api.get('/api/v1/partners/', { params })

export const getPartner = (id) =>
  api.get(`/api/v1/partners/${id}/`)

export const createPartner = (data) =>
  api.post('/api/v1/partners/', data)

export const updatePartner = (id, data) =>
  api.patch(`/api/v1/partners/${id}/`, data)

export const deletePartner = (id) =>
  api.delete(`/api/v1/partners/${id}/`)
