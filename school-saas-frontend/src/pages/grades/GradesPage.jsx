// ── src/pages/grades/GradesPage.jsx ──────────────────────
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, BookOpen, ClipboardList } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import PageHeader from '@/components/layout/PageHeader'
import FilterBar from '@/components/shared/FilterBar'
import SearchInput from '@/components/ui/SearchInput'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import RoleGuard from '@/components/shared/RoleGuard'
import Avatar from '@/components/ui/Avatar'
import { useExams, useCreateExam } from '@/hooks/useGrades'
import { useCourses } from '@/hooks/useCourses'
import { useAuthStore } from '@/store/authStore'
import { examSchema } from '@/utils/validators'
import { EXAM_TYPES } from '@/utils/constants'
import { formatDate } from '@/utils/formatters'
import { extractList, extractCount } from '@/utils/queryHelpers'
import clsx from 'clsx'

const typeColors = {
  midterm: 'bg-blue-50 text-blue-700',
  final: 'bg-purple-50 text-purple-700',
  quiz: 'bg-amber-50 text-amber-700',
  project: 'bg-emerald-50 text-emerald-700',
}

export default function GradesPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'
  const isTeacher = user?.role === 'teacher'

  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [examType, setExamType] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)

  const params = {
    page,
    page_size: 9,
    search: search || undefined,
    course: courseFilter || undefined,
    exam_type: examType || undefined,
  }

  const { data, isLoading, isError, error, refetch } = useExams(params)
  const { data: coursesData } = useCourses({ page_size: 100 })
  const createMut = useCreateExam()

  const exams = extractList(data)
  const total = extractCount(data)
  const courses = extractList(coursesData)
  const courseOptions = useMemo(
    () => courses.map((c) => ({ value: c.id, label: c.title })),
    [courses]
  )

  const form = useForm({
    resolver: zodResolver(examSchema),
    defaultValues: { course: '', title: '', module_name: '', exam_type: 'quiz' },
  })

  const handleCreate = (data) => {
    createMut.mutate(data, {
      onSuccess: () => {
        setModalOpen(false)
        form.reset()
      },
    })
  }

  if (isError) {
    return <div className="page-container"><ErrorState message={error?.message} onRetry={refetch} /></div>
  }

  return (
    <div className="page-container">
      <PageHeader title="Grades" subtitle="Exams, quizzes & assessments" />

      <RoleGuard roles={['admin', 'teacher']}>
        <div className="flex justify-end -mt-4">
          <Button icon={Plus} size="sm" onClick={() => { form.reset(); setModalOpen(true) }}>
            Create Exam
          </Button>
        </div>
      </RoleGuard>

      <FilterBar>
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1) }}
          placeholder="Search exams..."
          className="w-64"
        />
        <Select
          options={[{ value: '', label: 'All Courses' }, ...courseOptions]}
          value={courseFilter}
          onChange={(e) => { setCourseFilter(e.target.value); setPage(1) }}
        />
        <Select
          options={[{ value: '', label: 'All Types' }, ...EXAM_TYPES]}
          value={examType}
          onChange={(e) => { setExamType(e.target.value); setPage(1) }}
        />
      </FilterBar>

      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
      ) : exams.length === 0 ? (
        <div className="card text-center py-12 text-sm text-slate-500">
          No exams found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {exams.map((exam) => {
            const graded = exam.graded_count || 0
            const totalStudents = exam.total_count || 0
            const pct = totalStudents > 0 ? Math.round((graded / totalStudents) * 100) : 0
            const barColor = pct === 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-amber-500' : 'bg-slate-400'
            const typeBadgeColor = typeColors[exam.exam_type] || 'bg-slate-50 text-slate-700'

            return (
              <div
                key={exam.id}
                className="card flex flex-col hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/grades/${exam.id}`)}
              >
                {/* Title + Type badge */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-semibold text-slate-900 line-clamp-1">{exam.title}</h3>
                  <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap', typeBadgeColor)}>
                    {EXAM_TYPES.find((t) => t.value === exam.exam_type)?.label || exam.exam_type}
                  </span>
                </div>

                {/* Module name */}
                <div className="flex items-center gap-1.5 mb-2">
                  <BookOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-600 line-clamp-1">{exam.module_name}</span>
                </div>

                {/* Course */}
                <p className="text-xs text-slate-500 mb-3">{exam.course_title}</p>

                {/* Teacher */}
                {exam.teacher_name && (
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar name={exam.teacher_name} size="sm" />
                    <span className="text-sm text-slate-600">{exam.teacher_name}</span>
                  </div>
                )}

                {/* Progress bar */}
                <div className="mt-auto">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Graded</span>
                    <span>{graded} / {totalStudents}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={clsx('h-2 rounded-full transition-all', barColor)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">{formatDate(exam.created_at)}</span>
                  <button
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                    onClick={(e) => { e.stopPropagation(); navigate(`/grades/${exam.id}`) }}
                  >
                    <ClipboardList className="h-3.5 w-3.5" /> Grade
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Pagination page={page} pageSize={9} total={total} onPageChange={setPage} />

      {/* ── Create Exam Modal ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Exam"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="exam-form" loading={createMut.isPending}>Create</Button>
          </>
        }
      >
        <form id="exam-form" onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
          <Select
            label="Course"
            required
            options={[{ value: '', label: 'Select a course…' }, ...courseOptions]}
            error={form.formState.errors.course?.message}
            {...form.register('course')}
          />
          <Input
            label="Exam Title"
            required
            placeholder="e.g. Midterm Exam, Quiz 1"
            error={form.formState.errors.title?.message}
            {...form.register('title')}
          />
          <Input
            label="Module / Subject"
            required
            placeholder="e.g. Mathematics, Physics"
            error={form.formState.errors.module_name?.message}
            {...form.register('module_name')}
          />
          <Select
            label="Exam Type"
            required
            options={EXAM_TYPES}
            error={form.formState.errors.exam_type?.message}
            {...form.register('exam_type')}
          />
        </form>
      </Modal>
    </div>
  )
}
