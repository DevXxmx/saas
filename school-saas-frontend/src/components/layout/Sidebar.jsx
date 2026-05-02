// ── src/components/layout/Sidebar.jsx ────────────────────
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Mail,
  FileText,
  FolderOpen,
  Handshake,
  Shield,
  LogOut,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import clsx from 'clsx'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['admin', 'hr', 'teacher'] },
  { icon: GraduationCap, label: 'Students', path: '/students', roles: ['admin', 'hr'] },
  { icon: Users, label: 'Teachers', path: '/teachers', roles: ['admin', 'hr'] },
  { icon: BookOpen, label: 'Courses', path: '/courses', roles: ['admin', 'hr', 'teacher'] },
  { icon: ClipboardList, label: 'Grades', path: '/grades', roles: ['admin', 'hr', 'teacher'] },
  { icon: Mail, label: 'Compose Email', path: '/communications/compose', roles: ['admin'] },
  { icon: FileText, label: 'Email Logs', path: '/communications/logs', roles: ['admin'] },
  { icon: FolderOpen, label: 'Resources', path: '/resources', roles: ['admin', 'hr', 'teacher'] },
  { icon: Handshake, label: 'Partners', path: '/partners', roles: ['admin'] },
  { icon: Shield, label: 'Audit Log', path: '/audit', roles: ['admin'] },
]

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const user = useAuthStore((s) => s.user)
  const logoutMutation = useLogout()

  const filteredItems = navItems.filter((item) => item.roles.includes(user?.role))

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-100 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-slate-900">SchoolSaaS</span>
        {mobileOpen && (
          <button onClick={onMobileClose} className="ml-auto p-1 text-slate-400 hover:text-slate-600 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={onMobileClose}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-100 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <Avatar name={`${user?.first_name || ''} ${user?.last_name || ''}`} size="sm" src={user?.avatar} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <Badge variant="info" size="sm">
              {user?.role}
            </Badge>
          </div>
        </div>
        <button
          onClick={() => logoutMutation.mutate()}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div className="hidden lg:flex lg:w-64 lg:shrink-0">{content}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={onMobileClose} />
          <div className="fixed inset-y-0 left-0 w-64 z-50">{content}</div>
        </div>
      )}
    </>
  )
}
