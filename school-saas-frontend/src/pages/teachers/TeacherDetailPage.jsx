import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Pencil, Unlock } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '@/components/layout/PageHeader'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Table from '@/components/ui/Table'
import RoleGuard from '@/components/shared/RoleGuard'
import CourseTypeBadge from '@/components/shared/CourseTypeBadge'
import { useCourses } from '@/hooks/useCourses'
import { useResources } from '@/hooks/useResources'
import { formatDate, formatDateTime } from '@/utils/formatters'
import { CONTRACT_TYPES, STATUS_VARIANTS } from '@/utils/constants'
import { extractList } from '@/utils/queryHelpers'
import clsx from 'clsx'
import api from '@/api/axios'
import { useQuery } from '@tanstack/react-query'

const tabs = ['Courses', 'Resources', 'Schedule']

export default function TeacherDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Courses')
  const [isUnlocking, setIsUnlocking] = useState(false)

  const { data: teacher, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['teachers', id],
    queryFn: () => api.get(`/api/v1/users/${id}/`).then((r) => r.data),
    enabled: !!id,
  })

  const { data: coursesData } = useCourses({ teacher_user: id, page_size: 100 })
  const courses = extractList(coursesData)

  const { data: resourcesData } = useResources({ teacher_user: id, page_size: 100 })

  const handleUnlock = async () => {
    try {
      setIsUnlocking(true)
      await api.post(`/api/v1/users/${id}/unlock/`)
      toast.success('Account unlocked successfully')
      refetch()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to unlock account')
    } finally {
      setIsUnlocking(false)
    }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (isError) return <div className="page-container"><ErrorState message={error?.message} onRetry={refetch} /></div>

  const name = teacher?.full_name || `${teacher?.first_name || ''} ${teacher?.last_name || ''}`.trim()
  const tp = teacher?.teacher_profile || {}
  const contractLabel = CONTRACT_TYPES.find((c) => c.value === tp.contract_type)?.label || tp.contract_type
  const contractVariant = { full_time: 'success', part_time: 'warning', freelance: 'info' }

  const courseColumns = [
    { header: 'Title', accessorKey: 'title' },
    { header: 'Type', accessorKey: 'type', cell: ({ getValue }) => <CourseTypeBadge type={getValue()} /> },
    { header: 'Level', accessorKey: 'level' },
    { header: 'Status', accessorKey: 'status', cell: ({ getValue }) => {
      return <Badge variant={STATUS_VARIANTS[getValue()] || 'neutral'}>{getValue()}</Badge>
    }},
    { header: 'Start', accessorKey: 'start_date', cell: ({ getValue }) => formatDate(getValue()) },
  ]

  const allSessions = courses.flatMap((c) =>
    (c.sessions || []).map((s) => ({ ...s, course_title: c.title, course_type: c.type }))
  ).sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))

  return (
    <div className="page-container">
      <PageHeader title={name} />
      <RoleGuard roles={['admin']}>
        <div className="flex justify-end gap-3 -mt-4">
          {!teacher?.is_active && (
            <button 
              onClick={handleUnlock} 
              disabled={isUnlocking}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <Unlock className="h-4 w-4" /> {isUnlocking ? 'Unlocking...' : 'Unlock Account'}
            </button>
          )}
          <button onClick={() => navigate(`/teachers/${id}/edit`)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            <Pencil className="h-4 w-4" /> Edit
          </button>
        </div>
      </RoleGuard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card flex flex-col items-center text-center">
          <Avatar name={name} size="xl" src={teacher?.photo} />
          <h3 className="text-lg font-semibold text-slate-900 mt-3">{name}</h3>
          <p className="text-sm text-slate-500">{teacher?.email}</p>
          <Badge variant={contractVariant[tp.contract_type] || 'neutral'} className="mt-2">{contractLabel}</Badge>
          <div className="w-full mt-6 space-y-3 text-left text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Phone</span><span className="text-slate-800">{teacher?.phone || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Specialization</span><span className="text-slate-800">{tp.specialization || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Can Teach Online</span><span className="text-slate-800">{tp.can_teach_online ? 'Yes' : 'No'}</span></div>
          </div>
          {tp.bio && (
            <div className="w-full mt-4 pt-4 border-t border-slate-100 text-left">
              <p className="text-xs font-medium text-slate-500 mb-1">Bio</p>
              <p className="text-sm text-slate-700">{tp.bio}</p>
            </div>
          )}
          {tp.qualifications && (
            <div className="w-full mt-3 text-left">
              <p className="text-xs font-medium text-slate-500 mb-1">Qualifications</p>
              <p className="text-sm text-slate-700">{tp.qualifications}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-1 bg-white rounded-lg p-1 shadow-card border border-slate-100">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={clsx('flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors', activeTab === tab ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50')}>
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Courses' && (
            <Table columns={courseColumns} data={courses} emptyMessage="No courses assigned" onRowClick={(row) => navigate(`/courses/${row.id}`)} />
          )}

          {activeTab === 'Resources' && (
            <div className="space-y-3">
              {courses.length === 0 ? (
                <div className="card text-center text-sm text-slate-500 py-8">No courses — no resources</div>
              ) : courses.map((course) => {
                const courseResources = extractList(resourcesData).filter((r) => r.course === course.id)
                if (courseResources.length === 0) return null
                return (
                  <div key={course.id} className="card">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">{course.title}</h4>
                    <div className="space-y-2">
                      {courseResources.map((res) => (
                        <div key={res.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                          <div>
                            <p className="text-sm text-slate-800">{res.title}</p>
                            <p className="text-xs text-slate-400">{res.resource_type} · {formatDate(res.created_at)}</p>
                          </div>
                          <a href={res.file || res.external_url || '#'} target="_blank" rel="noreferrer" className="text-xs text-primary-600 hover:text-primary-700 font-medium">Open</a>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {courses.length > 0 && extractList(resourcesData).length === 0 && (
                <div className="card text-center text-sm text-slate-500 py-8">No resources uploaded for assigned courses</div>
              )}
            </div>
          )}

          {activeTab === 'Schedule' && (
            <div className="space-y-3">
              {allSessions.length === 0 && (
                <div className="card text-center text-sm text-slate-500 py-8">No upcoming sessions</div>
              )}
              {allSessions.map((s, i) => (
                <div key={i} className="card flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{s.course_title}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(s.scheduled_at)} · {s.duration_minutes} min</p>
                  </div>
                  <CourseTypeBadge type={s.course_type} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
