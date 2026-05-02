// ── src/hooks/useAudit.js ────────────────────────────────
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import * as auditApi from '@/api/audit'

export function useAuditLogs(params) {
  const { enabled = true, ...queryParams } = params || {}
  return useQuery({
    queryKey: ['audit-logs', queryParams],
    queryFn: () => auditApi.getAuditLogs(queryParams).then((r) => r.data),
    placeholderData: keepPreviousData,
    enabled,
  })
}
