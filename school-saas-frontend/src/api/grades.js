// ── src/api/grades.js ────────────────────────────────────
import api from './axios'

// ── Exams ──
export const getExams = (params) =>
  api.get('/api/v1/exams/', { params })

export const getExam = (id) =>
  api.get(`/api/v1/exams/${id}/`)

export const createExam = (data) =>
  api.post('/api/v1/exams/', data)

export const deleteExam = (id) =>
  api.delete(`/api/v1/exams/${id}/`)

// ── Grades (nested under exam) ──
export const getExamGrades = (examId) =>
  api.get(`/api/v1/exams/${examId}/grades/`)

export const updateGrade = (examId, gradeId, data) =>
  api.patch(`/api/v1/exams/${examId}/grades/${gradeId}/`, data)
