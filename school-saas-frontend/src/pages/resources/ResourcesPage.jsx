// ── src/pages/resources/ResourcesPage.jsx ────────────────
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, FileText, Video, Link2, Image, Download, Trash2 } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import FilterBar from '@/components/shared/FilterBar'
import SearchInput from '@/components/ui/SearchInput'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import FileUpload from '@/components/ui/FileUpload'
import Pagination from '@/components/ui/Pagination'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import RoleGuard from '@/components/shared/RoleGuard'
import { useResources, useUploadResource, useDeleteResource } from '@/hooks/useResources'
import { useCourses } from '@/hooks/useCourses'
import { RESOURCE_TYPES } from '@/utils/constants'
import { resourceSchema } from '@/utils/validators'
import { formatDate } from '@/utils/formatters'
import { extractList, extractCount } from '@/utils/queryHelpers'

const typeIcons = {
  document: FileText,
  video: Video,
  link: Link2,
  image: Image,
}

const typeColors = {
  document: 'bg-blue-50 text-blue-600',
  video: 'bg-purple-50 text-purple-600',
  link: 'bg-emerald-50 text-emerald-600',
  image: 'bg-amber-50 text-amber-600',
}

export default function ResourcesPage() {
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [uploadMode, setUploadMode] = useState('file')
  const [file, setFile] = useState(null)

  const params = {
    page,
    page_size: 12,
    search: search || undefined,
    course: courseFilter || undefined,
    resource_type: typeFilter || undefined,
  }

  const { data, isLoading, isError, error, refetch } = useResources(params)
  const { data: coursesData } = useCourses({ page_size: 100 })
  const uploadMut = useUploadResource()
  const deleteMut = useDeleteResource()

  const resources = extractList(data)
  const total = extractCount(data)
  const courses = extractList(coursesData)
  const courseOptions = courses.map((c) => ({ value: c.id, label: c.title }))

  const form = useForm({
    resolver: zodResolver(resourceSchema),
    defaultValues: { title: '', course: '', resource_type: 'document', external_url: '', has_file: false },
  })

  const handleUpload = (formData) => {
    const payload = new FormData()
    payload.append('title', formData.title)
    payload.append('course', formData.course)
    payload.append('resource_type', formData.resource_type)
    if (uploadMode === 'file' && file) {
      payload.append('file', file)
    } else if (uploadMode === 'link' && formData.external_url) {
      payload.append('external_url', formData.external_url)
    }
    uploadMut.mutate(payload, {
      onSuccess: () => {
        setModalOpen(false)
        form.reset()
        setFile(null)
      },
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMut.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
  }

  if (isError)
    return (
      <div className="page-container">
        <ErrorState message={error?.message} onRetry={refetch} />
      </div>
    )

  return (
    <div className="page-container">
      <PageHeader title="Resources" />
      <RoleGuard roles={['admin', 'teacher']}>
        <div className="flex justify-end -mt-4">
          <Button icon={Plus} size="sm" onClick={() => setModalOpen(true)}>
            Upload Resource
          </Button>
        </div>
      </RoleGuard>

      <FilterBar>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v)
            setPage(1)
          }}
          placeholder="Search resources..."
          className="w-64"
        />
        <Select
          options={[{ value: '', label: 'All Courses' }, ...courseOptions]}
          value={courseFilter}
          onChange={(e) => {
            setCourseFilter(e.target.value)
            setPage(1)
          }}
        />
        <Select
          options={[{ value: '', label: 'All Types' }, ...RESOURCE_TYPES]}
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value)
            setPage(1)
          }}
        />
      </FilterBar>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : resources.length === 0 ? (
        <div className="card text-center py-12 text-sm text-slate-500">No resources found</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {resources.map((res) => {
            const IconComp = typeIcons[res.resource_type] || FileText
            const colorClass = typeColors[res.resource_type] || typeColors.document
            return (
              <div key={res.id} className="card flex flex-col hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`rounded-lg p-2.5 ${colorClass}`}>
                    <IconComp className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 line-clamp-2">
                      {res.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {res.course_title || '—'}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-auto">
                  {res.uploaded_by_name || res.uploaded_by_display || '—'} ·{' '}
                  {formatDate(res.created_at)}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <a
                    href={res.file || res.external_url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    <Download className="h-3.5 w-3.5" /> Open
                  </a>
                  <RoleGuard roles={['admin']}>
                    <button
                      onClick={() => setDeleteTarget(res)}
                      className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </RoleGuard>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Pagination page={page} pageSize={12} total={total} onPageChange={setPage} />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Upload Resource"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="resource-form"
              loading={uploadMut.isPending}
            >
              Upload
            </Button>
          </>
        }
      >
        <form
          id="resource-form"
          onSubmit={form.handleSubmit(handleUpload)}
          className="space-y-4"
        >
          <Input
            label="Title"
            required
            error={form.formState.errors.title?.message}
            {...form.register('title')}
          />
          <Select
            label="Course"
            required
            placeholder="Select course"
            options={courseOptions}
            error={form.formState.errors.course?.message}
            {...form.register('course')}
          />
          <Select
            label="Resource Type"
            required
            options={RESOURCE_TYPES}
            error={form.formState.errors.resource_type?.message}
            {...form.register('resource_type')}
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUploadMode('file')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                uploadMode === 'file'
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('link')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                uploadMode === 'link'
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              External Link
            </button>
          </div>

          {uploadMode === 'file' ? (
            <FileUpload
              accept="*"
              maxSizeMB={50}
              label="File"
              onFileSelect={(f) => { setFile(f); form.setValue('has_file', !!f) }}
            />
          ) : (
            <Input
              label="External URL"
              type="url"
              placeholder="https://..."
              error={form.formState.errors.external_url?.message}
              {...form.register('external_url')}
            />
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Resource"
        message={`Delete "${deleteTarget?.title}"?`}
        loading={deleteMut.isPending}
      />
    </div>
  )
}
