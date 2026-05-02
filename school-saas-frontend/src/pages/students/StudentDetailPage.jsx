// ── src/pages/students/StudentDetailPage.jsx ─────────────
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Table from '@/components/ui/Table'
import RoleGuard from '@/components/shared/RoleGuard'
import PaymentStatusBadge from '@/components/shared/PaymentStatusBadge'
import { useStudent, useTranscript } from '@/hooks/useStudents'
import { useStudentAttendance } from '@/hooks/useAttendance'
import { formatDate, formatGPA, gradeColor } from '@/utils/formatters'
import { STATUS_VARIANTS } from '@/utils/constants'
import clsx from 'clsx'


const tabs = ['Enrollments', 'Attendance', 'Grades']

export default function StudentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Enrollments')

  const { data: student, isLoading, isError, error, refetch } = useStudent(id)
  const { data: attendanceData } = useStudentAttendance(id)
  const { data: transcriptData } = useTranscript(id)

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (isError) return <div className="page-container"><ErrorState message={error?.message} onRetry={refetch} /></div>

  const enrollments = student?.enrollments_summary || student?.enrollments || []
  const attendance = attendanceData?.results || attendanceData || []

  // Transcript returns { modules: [{ module_name, grades: [...] }] }
  // Flatten into a single grades array with module_name on each grade
  const grades = (transcriptData?.modules || []).flatMap((m) =>
    (m.grades || []).map((g) => ({ ...g, module_name: m.module_name }))
  )

  const enrollmentColumns = [
    { header: 'Course', accessorKey: 'course_title', cell: ({ row }) => row.original.course_title || row.original.course?.title || '—' },
    { header: 'Payment', accessorKey: 'payment_status', cell: ({ getValue }) => <PaymentStatusBadge status={getValue()} /> },
    { header: 'Enrolled', accessorKey: 'enrolled_at', cell: ({ getValue }) => formatDate(getValue()) },
    { header: 'Active', accessorKey: 'is_active', cell: ({ getValue }) => <Badge variant={getValue() ? 'success' : 'neutral'}>{getValue() ? 'Yes' : 'No'}</Badge> },
  ]

  const attendanceColumns = [
    { header: 'Course', accessorKey: 'course_title', cell: ({ row }) => row.original.course_title || '—' },
    { header: 'Session', accessorKey: 'session_date', cell: ({ getValue }) => formatDate(getValue()) },
    { header: 'Status', accessorKey: 'status', cell: ({ getValue }) => {
      const map = { present: 'success', absent: 'danger', late: 'warning', excused: 'info' }
      return <Badge variant={map[getValue()] || 'neutral'}>{getValue()}</Badge>
    }},
    { header: 'Consecutive Absences', accessorKey: 'consecutive_absences', cell: ({ getValue }) => getValue() ?? '—' },
  ]

  const gradesByModule = grades.reduce ? grades.reduce((acc, g) => {
    const key = g.module_name || 'General'
    if (!acc[key]) acc[key] = []
    acc[key].push(g)
    return acc
  }, {}) : {}

  return (
    <div className="page-container">
      <PageHeader
        title={`${student?.first_name || ''} ${student?.last_name || ''}`}
        actions={[
          { label: 'Edit', icon: Pencil, variant: 'secondary', onClick: () => navigate(`/students/${id}/edit`), roles: ['admin'] },
        ].filter(Boolean)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card flex flex-col items-center text-center">
          <Avatar name={`${student?.first_name} ${student?.last_name}`} size="xl" src={student?.photo} />
          <h3 className="text-lg font-semibold text-slate-900 mt-3">{student?.first_name} {student?.last_name}</h3>
          <p className="text-sm text-slate-500">{student?.email}</p>
          <Badge variant={STATUS_VARIANTS[student?.status] || 'neutral'} className="mt-2">{student?.status}</Badge>
          <div className="w-full mt-6 space-y-3 text-left text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Phone</span><span className="text-slate-800">{student?.phone || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">DOB</span><span className="text-slate-800">{formatDate(student?.date_of_birth)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">National ID</span><span className="text-slate-800">{student?.national_id || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Year Enrolled</span><span className="text-slate-800">{student?.year_enrolled || '—'}</span></div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-1 bg-white rounded-lg p-1 shadow-card border border-slate-100">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  activeTab === tab ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Enrollments' && (
            <Table columns={enrollmentColumns} data={enrollments} emptyMessage="No enrollments found" />
          )}

          {activeTab === 'Attendance' && (
            <Table columns={attendanceColumns} data={attendance} emptyMessage="No attendance records" />
          )}

          {activeTab === 'Grades' && (
            <div className="space-y-4">
              <div className="card">
                <p className="text-sm text-slate-500">Overall Average</p>
                <p className="text-2xl font-bold text-slate-900">{formatGPA(grades)}</p>
              </div>
              {Object.keys(gradesByModule).length > 0 ? (
                Object.entries(gradesByModule).map(([module, moduleGrades]) => (
                  <div key={module} className="card">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">{module}</h4>
                    <div className="space-y-2">
                      {moduleGrades.map((g, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                          <span className="text-sm text-slate-600">{g.exam_type}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{g.mark}</span>
                            {g.grade_letter && <Badge variant={gradeColor(g.grade_letter)}>{g.grade_letter}</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="card text-center text-sm text-slate-500 py-8">No grades recorded</div>
              )}
              <div className="flex justify-end">
                <button onClick={() => navigate(`/students/${id}/transcript`)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View Full Transcript →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
