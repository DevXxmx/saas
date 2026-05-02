// ── src/hooks/useCommunications.js ───────────────────────
import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as commsApi from '@/api/communications'
import { useNotificationStore } from '@/store/notificationStore'
import { extractErrorMessage } from '@/utils/errorUtils'

export function useSendEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => commsApi.sendBulkEmail(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-logs'] })
      toast.success('Email sent successfully')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to send email'))
    },
  })
}

export function useEmailLogs(params) {
  return useQuery({
    queryKey: ['email-logs', params],
    queryFn: () => commsApi.getEmailLogs(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  })
}

export function useEmailLog(id) {
  return useQuery({
    queryKey: ['email-logs', id],
    queryFn: () => commsApi.getEmailLog(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useNotifications(params) {
  const setNotifications = useNotificationStore((s) => s.setNotifications)
  const query = useQuery({
    queryKey: ['notifications', params],
    queryFn: () => commsApi.getNotifications(params).then((r) => r.data),
  })

  useEffect(() => {
    if (query.data) {
      const list = query.data?.results || query.data || []
      setNotifications(list)
    }
  }, [query.data, setNotifications])

  return query
}

export function useMarkRead() {
  const queryClient = useQueryClient()
  const decrementUnread = useNotificationStore((s) => s.decrementUnread)
  return useMutation({
    mutationFn: (id) => commsApi.markRead(id).then((r) => r.data),
    onSuccess: () => {
      decrementUnread()
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to mark as read'))
    },
  })
}

export function useMarkAllRead() {
  const queryClient = useQueryClient()
  const resetUnread = useNotificationStore((s) => s.resetUnread)
  return useMutation({
    mutationFn: () => commsApi.markAllRead().then((r) => r.data),
    onSuccess: () => {
      resetUnread()
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('All notifications marked as read')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Something went wrong'))
    },
  })
}
