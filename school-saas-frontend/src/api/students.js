// ── src/api/students.js ──────────────────────────────────
import api from './axios'

export const getStudents = (params) =>
  api.get('/api/v1/students/', { params })

export const getStudent = (id) =>
  api.get(`/api/v1/students/${id}/`)

export const createStudent = (data) =>
  api.post('/api/v1/students/', data)

export const updateStudent = (id, data) =>
  api.patch(`/api/v1/students/${id}/`, data)

export const deleteStudent = (id) =>
  api.delete(`/api/v1/students/${id}/`)

export const getTranscript = (id) =>
  api.get(`/api/v1/students/${id}/transcript/`)
