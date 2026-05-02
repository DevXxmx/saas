// ── src/api/courses.js ───────────────────────────────────
import api from './axios'

export const getCourses = (params) =>
  api.get('/api/v1/courses/', { params })

export const getCourse = (id) =>
  api.get(`/api/v1/courses/${id}/`)

export const createCourse = (data) =>
  api.post('/api/v1/courses/', data)

export const updateCourse = (id, data) =>
  api.patch(`/api/v1/courses/${id}/`, data)

export const deleteCourse = (id) =>
  api.delete(`/api/v1/courses/${id}/`)

export const getSessions = (courseId) =>
  api.get(`/api/v1/courses/${courseId}/sessions/`)

export const createSession = (courseId, data) =>
  api.post(`/api/v1/courses/${courseId}/sessions/`, data)

export const updateSession = (courseId, sessionId, data) =>
  api.patch(`/api/v1/courses/${courseId}/sessions/${sessionId}/`, data)

export const deleteSession = (courseId, sessionId) =>
  api.delete(`/api/v1/courses/${courseId}/sessions/${sessionId}/`)

export const getEnrollments = (courseId) =>
  api.get(`/api/v1/courses/${courseId}/enrollments/`)

export const createEnrollment = (courseId, data) =>
  api.post(`/api/v1/courses/${courseId}/enrollments/`, data)

export const updateEnrollment = (courseId, enrollmentId, data) =>
  api.patch(`/api/v1/courses/${courseId}/enrollments/${enrollmentId}/`, data)

export const deleteEnrollment = (courseId, enrollmentId) =>
  api.delete(`/api/v1/courses/${courseId}/enrollments/${enrollmentId}/`)

