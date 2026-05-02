// ── src/hooks/useAttendance.js ───────────────────────────
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as attendanceApi from '@/api/attendance'
import { extractErrorMessage } from '@/utils/errorUtils'

export function useBulkAttendance() {
  return useMutation({
    mutationFn: (data) => attendanceApi.bulkMarkAttendance(data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Attendance saved successfully')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to save attendance'))
    },
  })
}

export function useSessionAttendance(sessionId) {
  return useQuery({
    queryKey: ['attendance', 'session', sessionId],
    queryFn: () => attendanceApi.getSessionAttendance(sessionId).then((r) => r.data),
    enabled: !!sessionId,
  })
}

export function useStudentAttendance(studentId) {
  return useQuery({
    queryKey: ['attendance', 'student', studentId],
    queryFn: () => attendanceApi.getStudentAttendance(studentId).then((r) => r.data),
    enabled: !!studentId,
  })
}
