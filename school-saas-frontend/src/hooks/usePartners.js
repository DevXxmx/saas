// ── src/hooks/usePartners.js ─────────────────────────────
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as partnersApi from '@/api/partners'
import { extractErrorMessage } from '@/utils/errorUtils'

export function usePartners(params) {
  return useQuery({
    queryKey: ['partners', params],
    queryFn: () => partnersApi.getPartners(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  })
}

export function usePartner(id) {
  return useQuery({
    queryKey: ['partners', id],
    queryFn: () => partnersApi.getPartner(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreatePartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => partnersApi.createPartner(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] })
      toast.success('Partner created successfully')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Operation failed'))
    },
  })
}

export function useUpdatePartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => partnersApi.updatePartner(id, data).then((r) => r.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['partners'] })
      queryClient.invalidateQueries({ queryKey: ['partners', variables.id] })
      toast.success('Partner updated successfully')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to update partner'))
    },
  })
}

export function useDeletePartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => partnersApi.deletePartner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] })
      toast.success('Partner deleted successfully')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to delete partner'))
    },
  })
}
