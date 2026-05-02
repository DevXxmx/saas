// ── src/router/index.jsx ─────────────────────────────────
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Spinner from '@/components/ui/Spinner'
import AppLayout from '@/components/layout/AppLayout'

// ── Lazy-loaded pages ────────────────────────────────────
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const StudentsPage = lazy(() => import('@/pages/students/StudentsPage'))
const StudentDetailPage = lazy(() => import('@/pages/students/StudentDetailPage'))
const StudentFormPage = lazy(() => import('@/pages/students/StudentFormPage'))
const TeachersPage = lazy(() => import('@/pages/teachers/TeachersPage'))
const TeacherDetailPage = lazy(() => import('@/pages/teachers/TeacherDetailPage'))
const TeacherFormPage = lazy(() => import('@/pages/teachers/TeacherFormPage'))
const CoursesPage = lazy(() => import('@/pages/courses/CoursesPage'))
const CourseDetailPage = lazy(() => import('@/pages/courses/CourseDetailPage'))
const CourseFormPage = lazy(() => import('@/pages/courses/CourseFormPage'))
const CourseSessionsPage = lazy(() => import('@/pages/courses/CourseSessionsPage'))
const AttendancePage = lazy(() => import('@/pages/attendance/AttendancePage'))
const GradesPage = lazy(() => import('@/pages/grades/GradesPage'))
const ExamDetailPage = lazy(() => import('@/pages/grades/ExamDetailPage'))
const TranscriptPage = lazy(() => import('@/pages/grades/TranscriptPage'))
const EmailComposePage = lazy(() => import('@/pages/communications/EmailComposePage'))
const EmailLogsPage = lazy(() => import('@/pages/communications/EmailLogsPage'))
const ResourcesPage = lazy(() => import('@/pages/resources/ResourcesPage'))
const PartnersPage = lazy(() => import('@/pages/partners/PartnersPage'))
const PartnerDetailPage = lazy(() => import('@/pages/partners/PartnerDetailPage'))
const AuditLogPage = lazy(() => import('@/pages/audit/AuditLogPage'))
const NotFoundPage = lazy(() => import('@/pages/errors/NotFoundPage'))
const UnauthorizedPage = lazy(() => import('@/pages/errors/UnauthorizedPage'))

// ── Suspense wrapper for lazy pages ──────────────────────
function SuspenseWrapper({ children }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

function ProtectedRoute() {
  const isLoading = useAuthStore((s) => s.isLoading)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-tertiary">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <AppLayout />
}

/**
 * Route-level role guard — redirects to /unauthorized if the user's role
 * is not in the allowed list.
 */
function RoleRoute({ roles, children }) {
  const user = useAuthStore((s) => s.user)
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }
  return children
}

// Helper to wrap a lazy component in Suspense + optional RoleRoute
const page = (Component) => <SuspenseWrapper><Component /></SuspenseWrapper>
const guarded = (roles, Component) => (
  <RoleRoute roles={roles}><SuspenseWrapper><Component /></SuspenseWrapper></RoleRoute>
)

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <SuspenseWrapper><LoginPage /></SuspenseWrapper>,
  },
  {
    path: '/unauthorized',
    element: <SuspenseWrapper><UnauthorizedPage /></SuspenseWrapper>,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      { index: true, element: page(DashboardPage) },
      // Students — admin & hr
      { path: 'students', element: guarded(['admin', 'hr'], StudentsPage) },
      { path: 'students/new', element: guarded(['admin'], StudentFormPage) },
      { path: 'students/:id', element: guarded(['admin', 'hr'], StudentDetailPage) },
      { path: 'students/:id/edit', element: guarded(['admin'], StudentFormPage) },
      { path: 'students/:id/transcript', element: guarded(['admin', 'hr'], TranscriptPage) },
      // Teachers — admin & hr
      { path: 'teachers', element: guarded(['admin', 'hr'], TeachersPage) },
      { path: 'teachers/new', element: guarded(['admin'], TeacherFormPage) },
      { path: 'teachers/:id', element: guarded(['admin', 'hr'], TeacherDetailPage) },
      { path: 'teachers/:id/edit', element: guarded(['admin'], TeacherFormPage) },
      // Courses — all roles
      { path: 'courses', element: page(CoursesPage) },
      { path: 'courses/new', element: guarded(['admin'], CourseFormPage) },
      { path: 'courses/:id', element: page(CourseDetailPage) },
      { path: 'courses/:id/edit', element: guarded(['admin'], CourseFormPage) },
      { path: 'courses/:id/sessions', element: page(CourseSessionsPage) },
      // Attendance — admin (read-only) & teachers (read-write)
      { path: 'attendance/:sessionId', element: guarded(['admin', 'teacher'], AttendancePage) },
      // Grades — admin, teacher & hr (read-only)
      { path: 'grades', element: guarded(['admin', 'teacher', 'hr'], GradesPage) },
      { path: 'grades/:examId', element: guarded(['admin', 'teacher', 'hr'], ExamDetailPage) },
      // Communications — admin only
      { path: 'communications/compose', element: guarded(['admin'], EmailComposePage) },
      { path: 'communications/logs', element: guarded(['admin'], EmailLogsPage) },
      // Resources — all roles
      { path: 'resources', element: page(ResourcesPage) },
      // Partners — admin only
      { path: 'partners', element: guarded(['admin'], PartnersPage) },
      { path: 'partners/:id', element: guarded(['admin'], PartnerDetailPage) },
      // Audit — admin only
      { path: 'audit', element: guarded(['admin'], AuditLogPage) },
      { path: '*', element: page(NotFoundPage) },
    ],
  },
])
