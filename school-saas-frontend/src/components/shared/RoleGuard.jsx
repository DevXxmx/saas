// ── src/components/shared/RoleGuard.jsx ──────────────────
import { useAuthStore } from '@/store/authStore'

export default function RoleGuard({ roles = [], children, fallback = null }) {
  const user = useAuthStore((s) => s.user)
  const userRole = user?.role

  if (!roles.length || roles.includes(userRole)) {
    return children
  }

  return fallback
}
