// ── src/pages/students/StudentsPage.jsx ──────────────────
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import FilterBar from '@/components/shared/FilterBar'
import SearchInput from '@/components/ui/SearchInput'
import Select from '@/components/ui/Select'
import Table from '@/components/ui/Table'
import Pagination from '@/components/ui/Pagination'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ErrorState from '@/components/ui/ErrorState'
import RoleGuard from '@/components/shared/RoleGuard'
import Tooltip from '@/components/ui/Tooltip'
import { useStudents, useDeleteStudent } from '@/hooks/useStudents'
import { STUDENT_STATUSES, STATUS_VARIANTS } from '@/utils/constants'
import { extractList, extractCount } from '@/utils/queryHelpers'



export default function StudentsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const params = { page, page_size: 10, search: search || undefined, status: status || undefined }
  const { data, isLoading, isError, error, refetch } = useStudents(params)
  const deleteMutation = useDeleteStudent()

  const students = extractList(data)
  const total = extractCount(data)

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  const columns = [
    {
      header: 'Student',
      accessorKey: 'first_name',
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar name={`${s.first_name} ${s.last_name}`} size="sm" src={s.photo} />
            <div>
              <p className="font-medium text-slate-800">{s.first_name} {s.last_name}</p>
              <p className="text-xs text-slate-500">{s.email}</p>
            </div>
          </div>
        )
      },
    },
    { header: 'Status', accessorKey: 'status', cell: ({ getValue }) => <Badge variant={STATUS_VARIANTS[getValue()] || 'neutral'}>{getValue()}</Badge> },
    { header: 'Year', accessorKey: 'year_enrolled' },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Tooltip content="View">
              <button onClick={() => navigate(`/students/${s.id}`)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                <Eye className="h-4 w-4" />
              </button>
            </Tooltip>
            <RoleGuard roles={['admin']}>
              <Tooltip content="Edit">
                <button onClick={() => navigate(`/students/${s.id}/edit`)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
              </Tooltip>
              <Tooltip content="Delete">
                <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </Tooltip>
            </RoleGuard>
          </div>
        )
      },
    },
  ]

  if (isError) return <div className="page-container"><ErrorState message={error?.message} onRetry={refetch} /></div>

  return (
    <div className="page-container">
      <PageHeader title="Students" />
      <RoleGuard roles={['admin']}>
        <div className="flex justify-end -mt-4">
          <button onClick={() => navigate('/students/new')} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
            <Plus className="h-4 w-4" />
            Add Student
          </button>
        </div>
      </RoleGuard>

      <FilterBar>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search students..." className="w-64" />
        <Select
          options={[{ value: '', label: 'All Statuses' }, ...STUDENT_STATUSES]}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
        />
      </FilterBar>

      <Table columns={columns} data={students} loading={isLoading} emptyMessage="No students found" />
      <Pagination page={page} pageSize={10} total={total} onPageChange={setPage} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Student"
        message={`Are you sure you want to delete ${deleteTarget?.first_name} ${deleteTarget?.last_name}? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
