// ── src/api/teachers.js ──────────────────────────────────
import api from './axios'

export const getTeachers = (params) =>
  api.get('/api/v1/teachers/', { params })

export const getTeacher = (id) =>
  api.get(`/api/v1/teachers/${id}/`)

export const createTeacher = (data) =>
  api.post('/api/v1/teachers/', data)

export const updateTeacher = (id, data) =>
  api.patch(`/api/v1/teachers/${id}/`, data)

export const deleteTeacher = (id) =>
  api.delete(`/api/v1/teachers/${id}/`)
