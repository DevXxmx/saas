// ── src/pages/courses/CourseSessionsPage.jsx ─────────────
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, ClipboardCheck, Eye } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import PageHeader from '@/components/layout/PageHeader'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import RoleGuard from '@/components/shared/RoleGuard'
import { useCourse, useSessions, useCreateSession, useDeleteSession } from '@/hooks/useCourses'
import { useAuthStore } from '@/store/authStore'
import { formatDateTime } from '@/utils/formatters'
import { sessionSchema } from '@/utils/validators'
import { extractList } from '@/utils/queryHelpers'

export default function CourseSessionsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: course } = useCourse(id)
  const { data, isLoading, isError, error, refetch } = useSessions(id)
  const createMut = useCreateSession()
  const deleteMut = useDeleteSession()

  const sessions = extractList(data)

  const form = useForm({
    resolver: zodResolver(sessionSchema),
    defaultValues: { scheduled_at: '', duration_minutes: 60, notes: '' },
  })

  const handleCreate = (data) => {
    createMut.mutate({ courseId: id, data }, { onSuccess: () => { setModalOpen(false); form.reset() } })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMut.mutate({ courseId: id, sessionId: deleteTarget.id }, { onSuccess: () => setDeleteTarget(null) })
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (isError) return <div className="page-container"><ErrorState message={error?.message} onRetry={refetch} /></div>

  const columns = [
    { header: 'Date & Time', accessorKey: 'scheduled_at', cell: ({ getValue }) => formatDateTime(getValue()) },
    { header: 'Duration', accessorKey: 'duration_minutes', cell: ({ getValue }) => `${getValue()} min` },
    { header: 'Notes', accessorKey: 'notes', cell: ({ getValue }) => <span className="truncate max-w-[200px] block">{getValue() || '—'}</span> },
    {
      header: 'Actions', id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
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

  return (
    <div className="page-container">
      <PageHeader title={`Sessions — ${course?.title || ''}`} />
      <div className="flex justify-end">
        <RoleGuard roles={['admin']}>
          <Button icon={Plus} size="sm" onClick={() => setModalOpen(true)}>Add Session</Button>
        </RoleGuard>
      </div>

      <Table columns={columns} data={sessions} emptyMessage="No sessions" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Session" size="md"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button type="submit" form="session-form" loading={createMut.isPending}>Create</Button></>}
      >
        <form id="session-form" onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
          <Input label="Date & Time" type="datetime-local" required error={form.formState.errors.scheduled_at?.message} {...form.register('scheduled_at')} />
          <Input label="Duration (minutes)" type="number" required error={form.formState.errors.duration_minutes?.message} {...form.register('duration_minutes', { valueAsNumber: true })} />
          <Textarea label="Notes" rows={3} {...form.register('notes')} />
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Session" message="Delete this session?" loading={deleteMut.isPending} />
    </div>
  )
}
