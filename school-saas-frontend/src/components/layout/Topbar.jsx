// ── src/components/layout/Topbar.jsx ─────────────────────
import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import NotificationBell from '@/components/shared/NotificationBell'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'

const pageTitles = {
  '/': 'Dashboard',
  '/students': 'Students',
  '/teachers': 'Teachers',
  '/courses': 'Courses',
  '/grades': 'Grades',
  '/communications/compose': 'Compose Email',
  '/communications/logs': 'Email Logs',
  '/resources': 'Resources',
  '/partners': 'Partners',
  '/audit': 'Audit Log',
}

function getPageTitle(pathname) {
  if (pageTitles[pathname]) return pageTitles[pathname]
  if (pathname.includes('/students/') && pathname.includes('/edit')) return 'Edit Student'
  if (pathname.includes('/students/new')) return 'New Student'
  if (pathname.includes('/students/') && pathname.includes('/transcript')) return 'Transcript'
  if (pathname.includes('/students/')) return 'Student Details'
  if (pathname.includes('/teachers/') && pathname.includes('/edit')) return 'Edit Teacher'
  if (pathname.includes('/teachers/new')) return 'New Teacher'
  if (pathname.includes('/teachers/')) return 'Teacher Details'
  if (pathname.includes('/courses/') && pathname.includes('/edit')) return 'Edit Course'
  if (pathname.includes('/courses/new')) return 'New Course'
  if (pathname.includes('/courses/') && pathname.includes('/sessions')) return 'Course Sessions'
  if (pathname.includes('/courses/')) return 'Course Details'
  if (pathname.includes('/attendance/')) return 'Attendance'
  if (pathname.includes('/partners/')) return 'Partner Details'
  return 'SchoolSaaS'
}

export default function Topbar({ onMenuClick }) {
  const { pathname } = useLocation()
  const user = useAuthStore((s) => s.user)
  const title = getPageTitle(pathname)

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
          <Avatar name={`${user?.first_name || ''} ${user?.last_name || ''}`} size="sm" src={user?.avatar} />
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-700">
              {user?.first_name} {user?.last_name}
            </p>
          </div>
          <Badge variant="info" size="sm">
            {user?.role}
          </Badge>
        </div>
      </div>
    </header>
  )
}
