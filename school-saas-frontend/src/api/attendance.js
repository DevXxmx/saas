// ── src/api/attendance.js ────────────────────────────────
import api from './axios'

export const bulkMarkAttendance = (data) =>
  api.post('/api/v1/attendance/bulk/', data)

export const getSessionAttendance = (sessionId) =>
  api.get(`/api/v1/attendance/session/${sessionId}/`)

export const getStudentAttendance = (studentId) =>
  api.get(`/api/v1/attendance/student/${studentId}/`)
