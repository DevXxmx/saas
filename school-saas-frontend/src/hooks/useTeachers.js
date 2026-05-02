// ── src/hooks/useTeachers.js ─────────────────────────────
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import * as teachersApi from '@/api/teachers'

export function useTeachers(params) {
  const { enabled, ...queryParams } = params || {}
  return useQuery({
    queryKey: ['teachers', queryParams],
    queryFn: () => teachersApi.getTeachers(queryParams).then((r) => r.data),
    placeholderData: keepPreviousData,
    enabled: enabled !== false,
  })
}

export function useTeacher(id) {
  return useQuery({
    queryKey: ['teachers', id],
    queryFn: () => teachersApi.getTeacher(id).then((r) => r.data),
    enabled: !!id,
  })
}
