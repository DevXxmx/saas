// ── src/hooks/useGrades.js ───────────────────────────────
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as gradesApi from '@/api/grades'
import { extractErrorMessage } from '@/utils/errorUtils'

// ── Exams ──

export function useExams(params) {
  return useQuery({
    queryKey: ['exams', params],
    queryFn: () => gradesApi.getExams(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  })
}

export function useExam(id) {
  return useQuery({
    queryKey: ['exams', id],
    queryFn: () => gradesApi.getExam(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateExam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => gradesApi.createExam(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      toast.success('Exam created and grades generated for all students')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to create exam'))
    },
  })
}

export function useDeleteExam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => gradesApi.deleteExam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      toast.success('Exam deleted successfully')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to delete exam'))
    },
  })
}

// ── Grades (nested under exam) ──

export function useExamGrades(examId) {
  return useQuery({
    queryKey: ['exam-grades', examId],
    queryFn: () => gradesApi.getExamGrades(examId).then((r) => r.data),
    enabled: !!examId,
  })
}

export function useUpdateGrade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ examId, gradeId, data }) =>
      gradesApi.updateGrade(examId, gradeId, data).then((r) => r.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exam-grades', variables.examId] })
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      toast.success('Grade updated')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to update grade'))
    },
  })
}
