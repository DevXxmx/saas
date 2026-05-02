// ── src/hooks/useResources.js ────────────────────────────
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as resourcesApi from '@/api/resources'
import { extractErrorMessage } from '@/utils/errorUtils'

export function useResources(params) {
  return useQuery({
    queryKey: ['resources', params],
    queryFn: () => resourcesApi.getResources(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  })
}

export function useUploadResource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => resourcesApi.uploadResource(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      toast.success('Resource uploaded successfully')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Operation failed'))
    },
  })
}

export function useDeleteResource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => resourcesApi.deleteResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      toast.success('Resource deleted successfully')
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to delete resource'))
    },
  })
}
