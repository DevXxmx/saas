// ── src/hooks/useCourses.js ──────────────────────────────
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as coursesApi from '@/api/courses'
import { extractErrorMessage } from '@/utils/errorUtils'

export function useCourses(params) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => coursesApi.getCourses(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  })
}

export function useCourse(id) {
  return useQuery({
    queryKey: ['courses', id],
    queryFn: () => coursesApi.getCourse(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => coursesApi.createCourse(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      toast.success('Course created successfully')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Operation failed'))
    },
  })
}

export function useUpdateCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => coursesApi.updateCourse(id, data).then((r) => r.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['courses', variables.id] })
      toast.success('Course updated successfully')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to update course'))
    },
  })
}

export function useDeleteCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => coursesApi.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      toast.success('Course cancelled successfully')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to delete course'))
    },
  })
}

export function useSessions(courseId) {
  return useQuery({
    queryKey: ['sessions', courseId],
    queryFn: () => coursesApi.getSessions(courseId).then((r) => r.data),
    enabled: !!courseId,
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ courseId, data }) => coursesApi.createSession(courseId, data).then((r) => r.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.courseId] })
      toast.success('Session created successfully')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to create session'))
    },
  })
}

export function useUpdateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ courseId, sessionId, data }) =>
      coursesApi.updateSession(courseId, sessionId, data).then((r) => r.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.courseId] })
      toast.success('Session updated successfully')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to update session'))
    },
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ courseId, sessionId }) => coursesApi.deleteSession(courseId, sessionId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.courseId] })
      toast.success('Session deleted successfully')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to delete session'))
    },
  })
}

export function useEnrollments(courseId) {
  return useQuery({
    queryKey: ['enrollments', courseId],
    queryFn: () => coursesApi.getEnrollments(courseId).then((r) => r.data),
    enabled: !!courseId,
  })
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ courseId, data }) => coursesApi.createEnrollment(courseId, data).then((r) => r.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', variables.courseId] })
      toast.success('Student enrolled successfully')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to enroll student'))
    },
  })
}

export function useUpdateEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ courseId, enrollmentId, data }) =>
      coursesApi.updateEnrollment(courseId, enrollmentId, data).then((r) => r.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', variables.courseId] })
      toast.success('Enrollment updated successfully')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to update enrollment'))
    },
  })
}

export function useDeleteEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ courseId, enrollmentId }) =>
      coursesApi.deleteEnrollment(courseId, enrollmentId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', variables.courseId] })
      toast.success('Enrollment removed successfully')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to remove enrollment'))
    },
  })
}
