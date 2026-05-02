// ── src/pages/attendance/AttendancePage.jsx ───────────────
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useBulkAttendance } from '@/hooks/useAttendance'
import { useAuthStore } from '@/store/authStore'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/axios'
import { formatDate } from '@/utils/formatters'
import { ATTENDANCE_STATUSES } from '@/utils/constants'
import clsx from 'clsx'

export default function AttendancePage() {
  const { sessionId } = useParams()
  const user = useAuthStore((s) => s.user)
  const isReadOnly = user?.role === 'admin'
  const [records, setRecords] = useState({})
  const [saved, setSaved] = useState(false)

  // Single call — backend now returns { session, enrollments, attendance }
  const { data: sessionData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['session-attendance', sessionId],
    queryFn: () => api.get(`/api/v1/attendance/session/${sessionId}/`).then((r) => r.data),
    enabled: !!sessionId,
  })

  const bulkMutation = useBulkAttendance()

  const session = sessionData?.session || {}
  const enrollments = sessionData?.enrollments || []
  const existing = sessionData?.attendance || []

  useEffect(() => {
    if (existing.length > 0) {
      const map = {}
      existing.forEach((r) => {
        map[r.enrollment_id || r.enrollment] = r.status
      })
      setRecords(map)
    }
  }, [existing])

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (isError) return <div className="page-container"><ErrorState message={error?.message} onRetry={refetch} /></div>

  const handleStatusChange = (enrollmentId, status) => {
    if (isReadOnly) return
    setRecords((prev) => ({ ...prev, [enrollmentId]: status }))
    setSaved(false)
  }

  const handleSave = () => {
    const recordsArray = Object.entries(records).map(([enrollment_id, status]) => ({
      enrollment_id,
      status,
    }))
    bulkMutation.mutate({ session_id: sessionId, records: recordsArray }, {
      onSuccess: () => setSaved(true),
    })
  }

  // Students flagged as having 3+ consecutive absences come from the server
  // response (bulkMutation.data) which now returns refreshed consecutive_absences.
  const savedRecords = bulkMutation.data || []
  const consecutiveAbsences = enrollments.filter((e) => {
    const eid = e.id || e.enrollment_id
    const serverRecord = savedRecords.find(
      (r) => (r.enrollment_id || r.enrollment) === eid
    )
    return serverRecord && serverRecord.consecutive_absences >= 3
  })

  const statusCounts = Object.values(records).reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})

  return (
    <div className="page-container">
      <PageHeader
        title={`${isReadOnly ? 'View ' : ''}Attendance — ${session?.course_title || 'Session'} — ${formatDate(session?.scheduled_at || session?.date)}`}
      />

      {isReadOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700">
            👁 <strong>Read-only mode</strong> — Admins can view attendance records but only teachers can modify them.
          </p>
        </div>
      )}

      {consecutiveAbsences.length > 0 && saved && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-800">⚠ Students with 3+ consecutive absences:</p>
          <ul className="mt-1 text-sm text-amber-700 list-disc list-inside">
            {consecutiveAbsences.map((e, i) => (
              <li key={i}>{e.student_name || e.student_display || 'Unknown Student'}</li>
            ))}
          </ul>
        </div>
      )}

      {(saved || isReadOnly) && Object.keys(records).length > 0 && (
        <div className="flex gap-3">
          {ATTENDANCE_STATUSES.map((s) => (
            <Badge key={s.value} variant={s.value === 'present' ? 'success' : s.value === 'absent' ? 'danger' : s.value === 'late' ? 'warning' : 'info'}>
              {s.label}: {statusCounts[s.value] || 0}
            </Badge>
          ))}
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-100 shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {enrollments.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">No enrolled students</td></tr>
            )}
            {enrollments.map((e) => {
              const eid = e.id || e.enrollment_id
              const currentStatus = records[eid] || ''
              return (
                <tr key={eid} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{e.student_name || e.student_display || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{e.student_email || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {ATTENDANCE_STATUSES.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => handleStatusChange(eid, s.value)}
                          className={clsx(
                            'px-3 py-1 text-xs font-medium rounded-full border transition-all',
                            isReadOnly && 'cursor-default',
                            currentStatus === s.value
                              ? s.value === 'present' ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                              : s.value === 'absent' ? 'bg-red-100 border-red-300 text-red-700'
                              : s.value === 'late' ? 'bg-amber-100 border-amber-300 text-amber-700'
                              : 'bg-blue-100 border-blue-300 text-blue-700'
                              : isReadOnly
                                ? 'bg-slate-50 border-slate-200 text-slate-400'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {!isReadOnly && (
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={bulkMutation.isPending} disabled={Object.keys(records).length === 0}>
            Save Attendance
          </Button>
        </div>
      )}
    </div>
  )
}
