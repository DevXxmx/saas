// ── src/pages/dashboard/DashboardPage.jsx ────────────────
import { useMemo } from 'react'
import { Users, GraduationCap, BookOpen, Calendar, Clock, UserCheck, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import StatCard from '@/components/shared/StatCard'
import Spinner from '@/components/ui/Spinner'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import { useStudents } from '@/hooks/useStudents'
import { useCourses } from '@/hooks/useCourses'
import { useTeachers } from '@/hooks/useTeachers'
import { useAuditLogs } from '@/hooks/useAudit'
import { useAuthStore } from '@/store/authStore'
import { formatTimeAgo } from '@/utils/formatters'
import { STATUS_VARIANTS } from '@/utils/constants'
import { extractList } from '@/utils/queryHelpers'

const PIE_COLORS = ['#6366f1', '#94a3b8']

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'
  const isHR = user?.role === 'hr'
  const isTeacher = user?.role === 'teacher'
  const isAdminOrHR = isAdmin || isHR

  // ── All hooks called unconditionally at top level ──
  const { data: studentsData, isLoading: sl } = useStudents({ page_size: 1, enabled: isAdminOrHR })
  const { data: teachersData, isLoading: tl } = useTeachers({ page_size: 1, enabled: isAdminOrHR })
  const { data: auditData, isLoading: al } = useAuditLogs({ page_size: 10, enabled: isAdmin })
  const { data: coursesData, isLoading: cl } = useCourses({ status: 'active', page_size: 1 })
  const { data: allCourses, isLoading: acl } = useCourses({ page_size: 100 })

  const courses = useMemo(() => extractList(allCourses), [allCourses])
  const auditLogs = useMemo(() => extractList(auditData), [auditData])

  // ── Derived data (all useMemo BEFORE any return) ──
  const enrollmentChartData = useMemo(() =>
    courses
      .filter((c) => c.enrolled_count !== undefined)
      .sort((a, b) => (b.enrolled_count || 0) - (a.enrolled_count || 0))
      .slice(0, 6)
      .map((c) => ({ name: c.title?.substring(0, 15) || 'Course', enrollments: c.enrolled_count || 0 })),
    [courses]
  )

  const pieData = useMemo(() => {
    const onlineCount = courses.filter((c) => c.type === 'online').length
    const offlineCount = courses.filter((c) => c.type === 'offline').length
    return [
      { name: 'Online', value: onlineCount },
      { name: 'Offline', value: offlineCount },
    ]
  }, [courses])

  const totalEnrolled = useMemo(
    () => courses.reduce((sum, c) => sum + (c.enrolled_count || 0), 0),
    [courses]
  )
  const activeCourses = useMemo(
    () => courses.filter((c) => c.status === 'active'),
    [courses]
  )

  const upcomingSessions = useMemo(() => {
    const now = new Date()
    return courses
      .filter((c) => c.status === 'active' && c.end_date && new Date(c.end_date) >= now)
      .map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type,
        start_date: c.start_date,
        end_date: c.end_date,
        enrolled_count: c.enrolled_count || 0,
      }))
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
  }, [courses])

  // ── HR-specific: recent courses sorted by creation ──
  const recentCourses = useMemo(() =>
    [...courses]
      .sort((a, b) => new Date(b.created_at || b.start_date) - new Date(a.created_at || a.start_date))
      .slice(0, 8),
    [courses]
  )

  // ── Loading state (AFTER all hooks) ──
  const isLoading =
    (isAdminOrHR ? sl || tl : false) || cl || acl || (isAdmin && al)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  // ── Column definitions (not hooks, just objects) ──
  const auditColumns = [
    { header: 'Action', accessorKey: 'action', cell: ({ getValue }) => <Badge variant={getValue() === 'create' ? 'success' : getValue() === 'delete' ? 'danger' : 'info'}>{getValue()}</Badge> },
    { header: 'Model', accessorKey: 'model_affected' },
    { header: 'User', accessorKey: 'user_display', cell: ({ row }) => row.original.user_display || row.original.user_email || '—' },
    { header: 'Time', accessorKey: 'timestamp', cell: ({ getValue }) => formatTimeAgo(getValue()) },
  ]

  const teacherCourseColumns = [
    {
      header: 'Course',
      accessorKey: 'title',
      cell: ({ row }) => (
        <button
          onClick={() => navigate(`/courses/${row.original.id}`)}
          className="text-primary-600 hover:text-primary-700 font-medium text-left"
        >
          {row.original.title}
        </button>
      ),
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: ({ getValue }) => (
        <Badge variant={getValue() === 'online' ? 'info' : 'neutral'}>{getValue()}</Badge>
      ),
    },
    { header: 'Students', accessorKey: 'enrolled_count' },
    {
      header: 'Start',
      accessorKey: 'start_date',
      cell: ({ getValue }) => {
        if (!getValue()) return '—'
        try { return new Date(getValue()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
        catch { return '—' }
      },
    },
    {
      header: 'End',
      accessorKey: 'end_date',
      cell: ({ getValue }) => {
        if (!getValue()) return '—'
        try { return new Date(getValue()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
        catch { return '—' }
      },
    },
  ]

  const hrCourseColumns = [
    {
      header: 'Course',
      accessorKey: 'title',
      cell: ({ row }) => (
        <button
          onClick={() => navigate(`/courses/${row.original.id}`)}
          className="text-primary-600 hover:text-primary-700 font-medium text-left"
        >
          {row.original.title}
        </button>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ getValue }) => {
        const v = getValue()
        const variant = STATUS_VARIANTS[v] || 'neutral'
        return <Badge variant={variant}>{v}</Badge>
      },
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: ({ getValue }) => (
        <Badge variant={getValue() === 'online' ? 'info' : 'neutral'}>{getValue()}</Badge>
      ),
    },
    { header: 'Enrolled', accessorKey: 'enrolled_count', cell: ({ getValue }) => getValue() ?? 0 },
    {
      header: 'Teacher',
      accessorKey: 'teacher_name',
      cell: ({ row }) => row.original.teacher_name || row.original.teacher?.user?.full_name || '—',
    },
    {
      header: 'Start',
      accessorKey: 'start_date',
      cell: ({ getValue }) => {
        if (!getValue()) return '—'
        try { return new Date(getValue()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
        catch { return '—' }
      },
    },
  ]

  // ── Build greeting and subtitle per role ──
  const pageTitle = isTeacher
    ? `Welcome, ${user?.first_name || 'Teacher'}`
    : isHR
      ? `Welcome, ${user?.first_name || 'HR'}`
      : 'Dashboard'

  const pageSubtitle = isTeacher
    ? 'Your teaching overview'
    : isHR
      ? 'Students, teachers & course overview'
      : 'Overview of your school'

  return (
    <div className="page-container">
      <PageHeader title={pageTitle} subtitle={pageSubtitle} />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isTeacher ? (
          <>
            <StatCard title="My Courses" value={courses.length} icon={BookOpen} color="primary" />
            <StatCard title="Active Courses" value={activeCourses.length} icon={Calendar} color="emerald" />
            <StatCard title="My Students" value={totalEnrolled} icon={UserCheck} color="blue" />
            <StatCard title="Upcoming" value={upcomingSessions.length} icon={Clock} color="amber" />
          </>
        ) : (
          <>
            <StatCard title="Total Students" value={studentsData?.count ?? 0} icon={GraduationCap} color="primary" />
            <StatCard title="Total Teachers" value={teachersData?.count ?? 0} icon={Users} color="blue" />
            <StatCard title="Active Courses" value={coursesData?.count ?? 0} icon={BookOpen} color="emerald" />
            <StatCard title="Total Enrollments" value={totalEnrolled} icon={TrendingUp} color="amber" />
          </>
        )}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-base font-semibold text-slate-800 mb-4">
            {isTeacher ? 'Students per Course' : 'Enrollments by Course'}
          </h3>
          <div className="h-64">
            {enrollmentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollmentChartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RTooltip />
                  <Bar dataKey="enrollments" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-slate-400">
                No enrollment data available
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Course Types</h3>
          <div className="h-64">
            {courses.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-slate-400">
                No course data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Section (role-specific) ── */}
      {isTeacher && (
        <div>
          <h3 className="text-base font-semibold text-slate-800 mb-4">My Active Courses</h3>
          <Table columns={teacherCourseColumns} data={upcomingSessions} emptyMessage="No active courses" />
        </div>
      )}

      {isHR && (
        <div>
          <h3 className="text-base font-semibold text-slate-800 mb-4">Recent Courses</h3>
          <Table columns={hrCourseColumns} data={recentCourses} emptyMessage="No courses found" />
        </div>
      )}

      {isAdmin && (
        <div>
          <h3 className="text-base font-semibold text-slate-800 mb-4">Recent Activity</h3>
          <Table columns={auditColumns} data={auditLogs} emptyMessage="No recent activity" />
        </div>
      )}
    </div>
  )
}
