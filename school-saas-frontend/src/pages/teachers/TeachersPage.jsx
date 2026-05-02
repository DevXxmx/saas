// ── src/pages/teachers/TeachersPage.jsx ──────────────────
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Pencil, Check, X as XIcon } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import FilterBar from '@/components/shared/FilterBar'
import SearchInput from '@/components/ui/SearchInput'
import Select from '@/components/ui/Select'
import Table from '@/components/ui/Table'
import Pagination from '@/components/ui/Pagination'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import ErrorState from '@/components/ui/ErrorState'
import RoleGuard from '@/components/shared/RoleGuard'
import Tooltip from '@/components/ui/Tooltip'
import { useTeachers } from '@/hooks/useTeachers'
import { CONTRACT_TYPES } from '@/utils/constants'
import { extractList, extractCount } from '@/utils/queryHelpers'

export default function TeachersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [contractType, setContractType] = useState('')
  const [page, setPage] = useState(1)

  const params = {
    page,
    page_size: 10,
    search: search || undefined,
    contract_type: contractType || undefined,
  }
  const { data, isLoading, isError, error, refetch } = useTeachers(params)

  const teachers = extractList(data)
  const total = extractCount(data)

  const contractVariant = { full_time: 'success', part_time: 'warning', freelance: 'info' }

  const columns = [
    {
      header: 'Teacher',
      accessorKey: 'user',
      cell: ({ row }) => {
        const t = row.original
        const name = t.user?.full_name || `${t.user?.first_name || ''} ${t.user?.last_name || ''}`.trim() || '—'
        return (
          <div className="flex items-center gap-3">
            <Avatar name={name} size="sm" src={t.user?.photo} />
            <div>
              <p className="font-medium text-slate-800">{name}</p>
              <p className="text-xs text-slate-500">{t.user?.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      header: 'Specialization',
      accessorKey: 'specialization',
      cell: ({ getValue }) => getValue() || '—',
    },
    {
      header: 'Contract',
      accessorKey: 'contract_type',
      cell: ({ getValue }) => (
        <Badge variant={contractVariant[getValue()] || 'neutral'}>
          {CONTRACT_TYPES.find((c) => c.value === getValue())?.label || getValue()}
        </Badge>
      ),
    },
    {
      header: 'Online',
      accessorKey: 'can_teach_online',
      cell: ({ getValue }) =>
        getValue() ? (
          <Check className="h-4 w-4 text-emerald-500" />
        ) : (
          <XIcon className="h-4 w-4 text-slate-300" />
        ),
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => {
        const t = row.original
        const userId = t.user?.id
        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Tooltip content="View">
              <button
                onClick={() => navigate(`/teachers/${userId}`)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              >
                <Eye className="h-4 w-4" />
              </button>
            </Tooltip>
            <RoleGuard roles={['admin']}>
              <Tooltip content="Edit">
                <button
                  onClick={() => navigate(`/teachers/${userId}/edit`)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </Tooltip>
            </RoleGuard>
          </div>
        )
      },
    },
  ]

  if (isError)
    return (
      <div className="page-container">
        <ErrorState message={error?.message} onRetry={refetch} />
      </div>
    )

  return (
    <div className="page-container">
      <PageHeader title="Teachers" />
      <RoleGuard roles={['admin']}>
        <div className="flex justify-end -mt-4">
          <button
            onClick={() => navigate('/teachers/new')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Teacher
          </button>
        </div>
      </RoleGuard>

      <FilterBar>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v)
            setPage(1)
          }}
          placeholder="Search teachers..."
          className="w-64"
        />
        <Select
          options={[{ value: '', label: 'All Contracts' }, ...CONTRACT_TYPES]}
          value={contractType}
          onChange={(e) => {
            setContractType(e.target.value)
            setPage(1)
          }}
        />
      </FilterBar>

      <Table columns={columns} data={teachers} loading={isLoading} emptyMessage="No teachers found" />
      <Pagination page={page} pageSize={10} total={total} onPageChange={setPage} />
    </div>
  )
}
