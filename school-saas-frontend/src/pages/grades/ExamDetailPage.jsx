// ── src/pages/grades/ExamDetailPage.jsx ──────────────────
import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, BookOpen, CheckCircle2, Clock } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Table from '@/components/ui/Table'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import RoleGuard from '@/components/shared/RoleGuard'
import { useExam, useExamGrades, useUpdateGrade, useDeleteExam } from '@/hooks/useGrades'
import { useAuthStore } from '@/store/authStore'
import { EXAM_TYPES } from '@/utils/constants'
import { gradeColor } from '@/utils/formatters'
import { extractList } from '@/utils/queryHelpers'
import clsx from 'clsx'

export default function ExamDetailPage() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [editingCell, setEditingCell] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const { data: exam, isLoading: examLoading, isError, error, refetch } = useExam(examId)
  const { data: gradesData, isLoading: gradesLoading } = useExamGrades(examId)
  const updateMut = useUpdateGrade()
  const deleteMut = useDeleteExam()

  const grades = useMemo(() => extractList(gradesData), [gradesData])

  // Determine if current user is the course teacher
  const isTeacher = user?.role === 'teacher'
  const isCourseTeacher = isTeacher && exam?.teacher_user_id === String(user?.id)
  const canEditMarks = isCourseTeacher

  const gradedCount = useMemo(
    () => grades.filter((g) => g.mark !== null && g.mark !== undefined).length,
    [grades]
  )

  const handleInlineUpdate = (gradeId) => {
    const mark = parseFloat(editValue)
    if (isNaN(mark) || mark < 0 || mark > 100) return
    updateMut.mutate(
      { examId, gradeId, data: { mark } },
      { onSuccess: () => setEditingCell(null) }
    )
  }

  const handleDelete = () => {
    deleteMut.mutate(examId, { onSuccess: () => navigate('/grades') })
  }

  if (examLoading || gradesLoading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  }
  if (isError) {
    return <div className="page-container"><ErrorState message={error?.message} onRetry={refetch} /></div>
  }

  const examTypeLabel = EXAM_TYPES.find((t) => t.value === exam?.exam_type)?.label || exam?.exam_type

  const columns = [
    {
      header: 'Student',
      accessorKey: 'student_name',
      cell: ({ row }) => (
        <span className="font-medium text-slate-800">
          {row.original.student_name || '—'}
        </span>
      ),
    },
    {
      header: 'Email',
      accessorKey: 'student_email',
      cell: ({ row }) => (
        <span className="text-sm text-slate-500">{row.original.student_email || '—'}</span>
      ),
    },
    {
      header: 'Mark (/100)',
      accessorKey: 'mark',
      cell: ({ row }) => {
        const g = row.original
        if (editingCell === g.id && canEditMarks) {
          return (
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleInlineUpdate(g.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInlineUpdate(g.id)
                if (e.key === 'Escape') setEditingCell(null)
              }}
              className="w-20 text-sm border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-primary-500 focus:border-primary-500"
              autoFocus
              min={0}
              max={100}
              step="0.01"
            />
          )
        }
        if (g.mark === null || g.mark === undefined) {
          if (canEditMarks) {
            return (
              <button
                onClick={() => { setEditingCell(g.id); setEditValue('') }}
                className="text-sm text-slate-400 italic hover:text-primary-600 transition-colors"
              >
                Click to grade…
              </button>
            )
          }
          return <span className="text-sm text-slate-400 italic">Not graded</span>
        }
        if (canEditMarks) {
          return (
            <button
              onClick={() => { setEditingCell(g.id); setEditValue(g.mark?.toString() || '') }}
              className="text-sm font-semibold text-slate-800 hover:text-primary-600 transition-colors"
            >
              {g.mark}
            </button>
          )
        }
        return <span className="text-sm font-semibold text-slate-800">{g.mark}</span>
      },
    },
    {
      header: 'Grade',
      accessorKey: 'grade_letter',
      cell: ({ getValue }) =>
        getValue() ? <Badge variant={gradeColor(getValue())}>{getValue()}</Badge> : <span className="text-slate-400">—</span>,
    },
    {
      header: 'Status',
      id: 'status',
      cell: ({ row }) => {
        const graded = row.original.mark !== null && row.original.mark !== undefined
        return graded ? (
          <div className="flex items-center gap-1.5 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Graded</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Pending</span>
          </div>
        )
      },
    },
  ]

  return (
    <div className="page-container">
      {/* Back button */}
      <button
        onClick={() => navigate('/grades')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Exams
      </button>

      <PageHeader title={exam?.title || 'Exam'} />

      {/* Exam info card */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <Badge variant="info">{examTypeLabel}</Badge>
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-600">{exam?.module_name}</span>
          </div>
          <span className="text-sm text-slate-600">Course: <span className="font-medium">{exam?.course_title}</span></span>
          {exam?.teacher_name && (
            <span className="text-sm text-slate-600">Teacher: <span className="font-medium">{exam?.teacher_name}</span></span>
          )}
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Grading Progress</span>
            <span className="font-medium">{gradedCount} / {grades.length} students</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div
              className={clsx(
                'h-2.5 rounded-full transition-all',
                gradedCount === grades.length && grades.length > 0
                  ? 'bg-emerald-500'
                  : gradedCount > 0
                    ? 'bg-amber-500'
                    : 'bg-slate-300'
              )}
              style={{ width: grades.length > 0 ? `${(gradedCount / grades.length) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {/* Admin can delete */}
        <RoleGuard roles={['admin']}>
          <div className="flex justify-end mt-4">
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => setDeleteConfirm(true)}
            >
              Delete Exam
            </Button>
          </div>
        </RoleGuard>
      </div>

      {/* Grading table */}
      {canEditMarks && (
        <div className="text-xs text-slate-500 -mb-2">
          💡 Click on a mark or "Click to grade…" to edit inline. Press Enter to save.
        </div>
      )}
      <Table columns={columns} data={grades} emptyMessage="No students enrolled" />

      <ConfirmDialog
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Exam"
        message="This will permanently delete this exam and all associated grades. Are you sure?"
        loading={deleteMut.isPending}
      />
    </div>
  )
}
