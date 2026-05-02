// ── src/hooks/useAuth.js ─────────────────────────────────
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { login as loginApi, logout as logoutApi, getMe, changePassword as changePasswordApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { extractErrorMessage } from '@/utils/errorUtils'

export function useLogin() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: ({ email, password }) => loginApi(email, password),
    onSuccess: async (response) => {
      const { access, refresh } = response.data
      setTokens(access, refresh)
      try {
        const { data: user } = await getMe()
        setUser(user)
        toast.success('Welcome back!')
        navigate('/')
      } catch {
        toast.error('Failed to fetch user profile')
      }
    },
    onError: (err) => {
      const data = err.response?.data
      const msg = data?.non_field_errors?.[0] || data?.detail || 'Invalid credentials'
      toast.error(msg)
    },
  })
}

export function useLogout() {
  const navigate = useNavigate()
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const logout = useAuthStore((s) => s.logout)

  return useMutation({
    mutationFn: () => logoutApi(refreshToken),
    onSuccess: () => {
      logout()
      toast.success('Logged out successfully')
      navigate('/login')
    },
    onError: () => {
      logout()
      navigate('/login')
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data) => changePasswordApi(data),
    onSuccess: () => {
      toast.success('Password changed successfully')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to change password'))
    },
  })
}
