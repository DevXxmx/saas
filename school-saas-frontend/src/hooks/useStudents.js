// ── src/hooks/useStudents.js ─────────────────────────────
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as studentsApi from '@/api/students'
import { extractErrorMessage } from '@/utils/errorUtils'

export function useStudents(params) {
  const { enabled, ...queryParams } = params || {}
  return useQuery({
    queryKey: ['students', queryParams],
    queryFn: () => studentsApi.getStudents(queryParams).then((r) => r.data),
    placeholderData: keepPreviousData,
    enabled: enabled !== false,
  })
}

export function useStudent(id) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: () => studentsApi.getStudent(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => studentsApi.createStudent(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      toast.success('Student created successfully')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to create student'))
    },
  })
}

export function useUpdateStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => studentsApi.updateStudent(id, data).then((r) => r.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['students', variables.id] })
      toast.success('Student updated successfully')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to update student'))
    },
  })
}

export function useDeleteStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => studentsApi.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      toast.success('Student deactivated successfully')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to delete student'))
    },
  })
}

export function useTranscript(studentId) {
  return useQuery({
    queryKey: ['transcript', studentId],
    queryFn: () => studentsApi.getTranscript(studentId).then((r) => r.data),
    enabled: !!studentId,
  })
}
