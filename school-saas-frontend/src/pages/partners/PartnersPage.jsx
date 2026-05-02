// ── src/pages/partners/PartnersPage.jsx ──────────────────
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import PageHeader from '@/components/layout/PageHeader'
import FilterBar from '@/components/shared/FilterBar'
import SearchInput from '@/components/ui/SearchInput'
import Table from '@/components/ui/Table'
import Pagination from '@/components/ui/Pagination'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ErrorState from '@/components/ui/ErrorState'
import Tooltip from '@/components/ui/Tooltip'
import { usePartners, useCreatePartner, useDeletePartner } from '@/hooks/usePartners'
import { partnerSchema } from '@/utils/validators'
import { PARTNER_TYPES } from '@/utils/constants'
import { extractList, extractCount } from '@/utils/queryHelpers'

const typeVariant = {
  company: 'success',
  institution: 'info',
  ngo: 'warning',
  other: 'neutral',
}

export default function PartnersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const params = { page, page_size: 10, search: search || undefined }
  const { data, isLoading, isError, error, refetch } = usePartners(params)
  const createMut = useCreatePartner()
  const deleteMut = useDeletePartner()

  const partners = extractList(data)
  const total = extractCount(data)

  const form = useForm({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: '',
      type: 'company',
      contact_person: '',
      email: '',
      phone: '',
      notes: '',
    },
  })

  const handleCreate = (data) => {
    createMut.mutate(data, {
      onSuccess: () => {
        setModalOpen(false)
        form.reset()
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

  const columns = [
    {
      header: 'Name',
      accessorKey: 'name',
      cell: ({ getValue }) => (
        <span className="font-medium text-slate-800">{getValue()}</span>
      ),
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: ({ getValue }) => (
        <Badge variant={typeVariant[getValue()] || 'neutral'}>
          {PARTNER_TYPES.find((t) => t.value === getValue())?.label || getValue()}
        </Badge>
      ),
    },
    { header: 'Contact Person', accessorKey: 'contact_person' },
    { header: 'Email', accessorKey: 'email' },
    {
      header: 'Phone',
      accessorKey: 'phone',
      cell: ({ getValue }) => getValue() || '—',
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => {
        const p = row.original
        return (
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Tooltip content="View">
              <button
                onClick={() => navigate(`/partners/${p.id}`)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              >
                <Eye className="h-4 w-4" />
              </button>
            </Tooltip>
            <Tooltip content="Delete">
              <button
                onClick={() => setDeleteTarget(p)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
        )
      },
    },
  ]

  return (
    <div className="page-container">
      <PageHeader title="Partners" />
      <div className="flex justify-end -mt-4">
        <Button icon={Plus} size="sm" onClick={() => setModalOpen(true)}>
          Add Partner
        </Button>
      </div>

      <FilterBar>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v)
            setPage(1)
          }}
          placeholder="Search partners..."
          className="w-64"
        />
      </FilterBar>

      <Table
        columns={columns}
        data={partners}
        loading={isLoading}
        emptyMessage="No partners found"
        onRowClick={(row) => navigate(`/partners/${row.id}`)}
      />
      <Pagination page={page} pageSize={10} total={total} onPageChange={setPage} />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Partner"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="partner-form"
              loading={createMut.isPending}
            >
              Create
            </Button>
          </>
        }
      >
        <form
          id="partner-form"
          onSubmit={form.handleSubmit(handleCreate)}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Name"
              required
              error={form.formState.errors.name?.message}
              {...form.register('name')}
            />
            <Select
              label="Type"
              required
              options={PARTNER_TYPES}
              error={form.formState.errors.type?.message}
              {...form.register('type')}
            />
            <Input
              label="Contact Person"
              required
              error={form.formState.errors.contact_person?.message}
              {...form.register('contact_person')}
            />
            <Input
              label="Email"
              type="email"
              required
              error={form.formState.errors.email?.message}
              {...form.register('email')}
            />
            <Input
              label="Phone"
              error={form.formState.errors.phone?.message}
              {...form.register('phone')}
            />
          </div>
          <Textarea
            label="Notes"
            rows={3}
            error={form.formState.errors.notes?.message}
            {...form.register('notes')}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Partner"
        message={`Delete "${deleteTarget?.name}"? This action cannot be undone.`}
        loading={deleteMut.isPending}
      />
    </div>
  )
}
