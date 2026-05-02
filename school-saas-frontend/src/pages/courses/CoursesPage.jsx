// ── src/pages/courses/CoursesPage.jsx ────────────────────
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import FilterBar from '@/components/shared/FilterBar'
import SearchInput from '@/components/ui/SearchInput'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Pagination from '@/components/ui/Pagination'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import RoleGuard from '@/components/shared/RoleGuard'
import CourseTypeBadge from '@/components/shared/CourseTypeBadge'
import { useCourses } from '@/hooks/useCourses'
import { COURSE_STATUSES, STATUS_VARIANTS } from '@/utils/constants'
import { extractList, extractCount } from '@/utils/queryHelpers'
import { formatDate } from '@/utils/formatters'
import clsx from 'clsx'



export default function CoursesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const params = {
    page,
    page_size: 9,
    search: search || undefined,
    type: type || undefined,
    status: status || undefined,
  }
  const { data, isLoading, isError, error, refetch } = useCourses(params)

  const courses = extractList(data)
  const total = extractCount(data)

  if (isError) return <div className="page-container"><ErrorState message={error?.message} onRetry={refetch} /></div>

  return (
    <div className="page-container">
      <PageHeader title="Courses" />
      <RoleGuard roles={['admin']}>
        <div className="flex justify-end -mt-4">
          <button onClick={() => navigate('/courses/new')} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> New Course
          </button>
        </div>
      </RoleGuard>

      <FilterBar>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search courses..." className="w-64" />
        <Select options={[{ value: '', label: 'All Types' }, { value: 'online', label: 'Online' }, { value: 'offline', label: 'Offline' }]} value={type} onChange={(e) => { setType(e.target.value); setPage(1) }} />
        <Select options={[{ value: '', label: 'All Statuses' }, ...COURSE_STATUSES]} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} />
      </FilterBar>

      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
      ) : courses.length === 0 ? (
        <div className="card text-center py-12 text-sm text-slate-500">No courses found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course) => {
            const enrolled = course.enrolled_count || 0
            const maxEnrollment = 15
            const pct = Math.min((enrolled / maxEnrollment) * 100, 100)
            const barColor = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'

            return (
              <div key={course.id} className="card flex flex-col hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/courses/${course.id}`)}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-semibold text-slate-900 line-clamp-1">{course.title}</h3>
                  <CourseTypeBadge type={course.type} />
                </div>

                {(course.teacher_name || course.teacher_display) && (
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar name={course.teacher_name || course.teacher_display} size="sm" />
                    <span className="text-sm text-slate-600">{course.teacher_name || course.teacher_display}</span>
                  </div>
                )}

                <div className="text-xs text-slate-500 space-y-1 mb-3">
                  <p>Level: {course.level || '—'}</p>
                  <p>{formatDate(course.start_date)} – {formatDate(course.end_date)}</p>
                </div>

                <div className="mt-auto">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Enrolled</span>
                    <span>{enrolled} / {maxEnrollment}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={clsx('h-2 rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                  <Badge variant={STATUS_VARIANTS[course.status] || 'neutral'}>{course.status}</Badge>
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1" onClick={(e) => { e.stopPropagation(); navigate(`/courses/${course.id}`) }}>
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Pagination page={page} pageSize={9} total={total} onPageChange={setPage} />
    </div>
  )
}
