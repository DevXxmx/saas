// ── src/pages/courses/CourseDetailPage.jsx ────────────────
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Pencil, Plus, Trash2, ClipboardCheck, ExternalLink, FileText, Video, Link2, Image, Download, Eye } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import PageHeader from '@/components/layout/PageHeader'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Table from '@/components/ui/Table'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import SearchInput from '@/components/ui/SearchInput'
import Textarea from '@/components/ui/Textarea'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import RoleGuard from '@/components/shared/RoleGuard'
import CourseTypeBadge from '@/components/shared/CourseTypeBadge'
import { useCourse, useSessions, useCreateSession, useDeleteSession, useEnrollments, useCreateEnrollment, useUpdateEnrollment, useDeleteEnrollment } from '@/hooks/useCourses'
import { useStudents } from '@/hooks/useStudents'
import { useResources } from '@/hooks/useResources'
import { useAuthStore } from '@/store/authStore'
import { formatDate, formatDateTime } from '@/utils/formatters'
import { sessionSchema, enrollmentSchema } from '@/utils/validators'
import { PAYMENT_STATUSES, STATUS_VARIANTS } from '@/utils/constants'
import { extractList } from '@/utils/queryHelpers'
import clsx from 'clsx'

const typeIcons = { pdf: FileText, document: FileText, video: Video, link: Link2, slide: Image, other: FileText }
const typeColors = {
  pdf: 'bg-red-50 text-red-600', document: 'bg-blue-50 text-blue-600',
  video: 'bg-purple-50 text-purple-600', link: 'bg-emerald-50 text-emerald-600',
  slide: 'bg-amber-50 text-amber-600', other: 'bg-slate-50 text-slate-600',
}

const statusVariant = STATUS_VARIANTS
const tabs = ['Sessions', 'Enrollments', 'Resources']

export default function CourseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [activeTab, setActiveTab] = useState('Sessions')
  const [sessionModal, setSessionModal] = useState(false)
  const [enrollModal, setEnrollModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteEnrollTarget, setDeleteEnrollTarget] = useState(null)
  const [studentSearch, setStudentSearch] = useState('')

  const { data: course, isLoading, isError, error, refetch } = useCourse(id)
  const { data: sessionsData } = useSessions(id)
  const { data: enrollmentsData } = useEnrollments(id)
  const { data: resourcesData } = useResources({ course: id, page_size: 50 })
  const { data: studentsData } = useStudents({ search: studentSearch, page_size: 10 })

  const createSessionMut = useCreateSession()
  const deleteSessionMut = useDeleteSession()
  const createEnrollMut = useCreateEnrollment()
  const updateEnrollMut = useUpdateEnrollment()
  const deleteEnrollMut = useDeleteEnrollment()

  const sessions = extractList(sessionsData)
  const enrollments = extractList(enrollmentsData)
  const courseResources = extractList(resourcesData)
  const students = extractList(studentsData)

  const sessionForm = useForm({
    resolver: zodResolver(sessionSchema),
    defaultValues: { scheduled_at: '', duration_minutes: 60, notes: '' },
  })

  const enrollForm = useForm({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: { student: '', payment_status: 'pending' },
  })

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (isError) return <div className="page-container"><ErrorState message={error?.message} onRetry={refetch} /></div>

  const handleCreateSession = (data) => {
    createSessionMut.mutate({ courseId: id, data }, { onSuccess: () => { setSessionModal(false); sessionForm.reset() } })
  }

  const handleDeleteSession = () => {
    if (!deleteTarget) return
    deleteSessionMut.mutate({ courseId: id, sessionId: deleteTarget.id }, { onSuccess: () => setDeleteTarget(null) })
  }

  const handleCreateEnrollment = (data) => {
    createEnrollMut.mutate({ courseId: id, data }, { onSuccess: () => { setEnrollModal(false); enrollForm.reset() } })
  }

  const handleUpdatePayment = (enrollmentId, paymentStatus) => {
    updateEnrollMut.mutate({ courseId: id, enrollmentId, data: { payment_status: paymentStatus } })
  }

  const handleDeleteEnrollment = () => {
    if (!deleteEnrollTarget) return
    deleteEnrollMut.mutate({ courseId: id, enrollmentId: deleteEnrollTarget.id }, { onSuccess: () => setDeleteEnrollTarget(null) })
  }

  const sessionColumns = [
    { header: 'Date & Time', accessorKey: 'scheduled_at', cell: ({ getValue }) => formatDateTime(getValue()) },
    { header: 'Duration', accessorKey: 'duration_minutes', cell: ({ getValue }) => `${getValue()} min` },
    { header: 'Notes', accessorKey: 'notes', cell: ({ getValue }) => <span className="truncate max-w-[200px] block">{getValue() || '—'}</span> },
    {
      header: 'Actions', id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <Button variant="ghost" size="sm" icon={user?.role === 'admin' ? Eye : ClipboardCheck} onClick={() => navigate(`/attendance/${row.original.id}`)}>
              {user?.role === 'admin' ? 'View' : 'Attendance'}
            </Button>
          )}
          <RoleGuard roles={['admin']}>
            <button onClick={() => setDeleteTarget(row.original)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </RoleGuard>
        </div>
      ),
    },
  ]

  const enrollmentColumns = [
    { header: 'Student', accessorKey: 'student', cell: ({ row }) => row.original.student?.full_name || '—' },
    { header: 'Email', accessorKey: 'student_email', cell: ({ row }) => row.original.student?.email || '—' },
    {
      header: 'Payment', accessorKey: 'payment_status',
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <select
            value={row.original.payment_status}
            onChange={(e) => handleUpdatePayment(row.original.id, e.target.value)}
            className="text-xs border-slate-300 rounded-lg py-1 px-2 focus:ring-primary-500"
          >
            {PAYMENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      ),
    },
    { header: 'Enrolled', accessorKey: 'enrolled_at', cell: ({ getValue }) => formatDate(getValue()) },
    {
      header: '', id: 'remove',
      cell: ({ row }) => (
        <RoleGuard roles={['admin']}>
          <button onClick={(e) => { e.stopPropagation(); setDeleteEnrollTarget(row.original) }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </RoleGuard>
      ),
    },
  ]

  return (
    <div className="page-container">
      <PageHeader title={course?.title || 'Course Details'} />
      <RoleGuard roles={['admin']}>
        <div className="flex justify-end -mt-4 gap-2">
          <Button variant="secondary" icon={Pencil} onClick={() => navigate(`/courses/${id}/edit`)}>Edit</Button>
        </div>
      </RoleGuard>

      <div className="card">
        <div className="flex flex-wrap gap-4 items-center">
          <CourseTypeBadge type={course?.type} />
          <Badge variant={statusVariant[course?.status] || 'neutral'}>{course?.status}</Badge>
          <span className="text-sm text-slate-600">Level: {course?.level || '—'}</span>
          <span className="text-sm text-slate-600">Teacher: {course?.teacher_name || course?.teacher_display || '—'}</span>
          <span className="text-sm text-slate-600">{formatDate(course?.start_date)} – {formatDate(course?.end_date)}</span>
          {course?.type === 'offline' && <span className="text-sm text-slate-600">📍 {course?.location || '—'}</span>}
          {course?.type === 'online' && course?.virtual_link && (
            <a href={course.virtual_link} target="_blank" rel="noreferrer" className="text-sm text-primary-600 flex items-center gap-1 hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> Virtual Link
            </a>
          )}
        </div>
        {course?.description && <p className="mt-3 text-sm text-slate-600">{course.description}</p>}
      </div>

      <div className="flex gap-1 bg-white rounded-lg p-1 shadow-card border border-slate-100">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={clsx('flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors', activeTab === tab ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50')}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Sessions' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <RoleGuard roles={['admin']}>
              <Button icon={Plus} size="sm" onClick={() => setSessionModal(true)}>Add Session</Button>
            </RoleGuard>
          </div>
          <Table columns={sessionColumns} data={sessions} emptyMessage="No sessions scheduled" />
        </div>
      )}

      {activeTab === 'Enrollments' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <RoleGuard roles={['admin']}>
              <Button icon={Plus} size="sm" onClick={() => setEnrollModal(true)}>Enroll Student</Button>
            </RoleGuard>
          </div>
          <Table columns={enrollmentColumns} data={enrollments} emptyMessage="No students enrolled" />
        </div>
      )}

      {activeTab === 'Resources' && (
        <div className="space-y-4">
          {courseResources.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-sm text-slate-500 mb-3">No resources uploaded for this course</p>
              <Button variant="secondary" size="sm" onClick={() => navigate('/resources')}>Go to Resources</Button>
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <Button variant="secondary" size="sm" onClick={() => navigate('/resources')}>Manage All Resources</Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courseResources.map((res) => {
                  const IconComp = typeIcons[res.resource_type] || FileText
                  const colorClass = typeColors[res.resource_type] || typeColors.other
                  return (
                    <div key={res.id} className="card flex flex-col hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`rounded-lg p-2.5 ${colorClass}`}>
                          <IconComp className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 line-clamp-2">{res.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{formatDate(res.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center mt-auto pt-3 border-t border-slate-100">
                        <a
                          href={res.file || res.external_url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                        >
                          <Download className="h-3.5 w-3.5" /> Open
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      <Modal open={sessionModal} onClose={() => setSessionModal(false)} title="Add Session" size="md"
        footer={<><Button variant="secondary" onClick={() => setSessionModal(false)}>Cancel</Button><Button type="submit" form="session-form" loading={createSessionMut.isPending}>Create</Button></>}
      >
        <form id="session-form" onSubmit={sessionForm.handleSubmit(handleCreateSession)} className="space-y-4">
          <Input label="Date & Time" type="datetime-local" required error={sessionForm.formState.errors.scheduled_at?.message} {...sessionForm.register('scheduled_at')} />
          <Input label="Duration (minutes)" type="number" required error={sessionForm.formState.errors.duration_minutes?.message} {...sessionForm.register('duration_minutes', { valueAsNumber: true })} />
          <Textarea label="Notes" rows={3} {...sessionForm.register('notes')} />
        </form>
      </Modal>

      <Modal open={enrollModal} onClose={() => setEnrollModal(false)} title="Enroll Student" size="md"
        footer={<><Button variant="secondary" onClick={() => setEnrollModal(false)}>Cancel</Button><Button type="submit" form="enroll-form" loading={createEnrollMut.isPending}>Enroll</Button></>}
      >
        <form id="enroll-form" onSubmit={enrollForm.handleSubmit(handleCreateEnrollment)} className="space-y-4">
          <div>
            <SearchInput value={studentSearch} onChange={setStudentSearch} placeholder="Search students..." />
            {students.length > 0 && studentSearch && (
              <div className="mt-2 border border-slate-200 rounded-lg max-h-40 overflow-y-auto">
                {students.map((s) => (
                  <button key={s.id} type="button" onClick={() => { enrollForm.setValue('student', s.id); setStudentSearch(s.full_name) }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors">
                    {s.full_name} — {s.email}
                  </button>
                ))}
              </div>
            )}
            {enrollForm.formState.errors.student && <p className="mt-1 text-xs text-red-500">{enrollForm.formState.errors.student.message}</p>}
          </div>
          <Select label="Payment Status" options={PAYMENT_STATUSES} error={enrollForm.formState.errors.payment_status?.message} {...enrollForm.register('payment_status')} />
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteSession} title="Delete Session" message="Are you sure you want to delete this session?" loading={deleteSessionMut.isPending} />
      <ConfirmDialog open={!!deleteEnrollTarget} onClose={() => setDeleteEnrollTarget(null)} onConfirm={handleDeleteEnrollment} title="Remove Enrollment" message={`Remove ${deleteEnrollTarget?.student_name || 'this student'} from the course?`} loading={deleteEnrollMut.isPending} />
    </div>
  )
}
