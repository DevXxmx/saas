// ── src/pages/partners/PartnerDetailPage.jsx ─────────────
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Pencil, Mail, Download } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import PageHeader from '@/components/layout/PageHeader'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Table from '@/components/ui/Table'
import Drawer from '@/components/ui/Drawer'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import { usePartner, useUpdatePartner } from '@/hooks/usePartners'
import { useEmailLogs } from '@/hooks/useCommunications'
import { partnerSchema } from '@/utils/validators'
import { PARTNER_TYPES } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/formatters'

const typeVariant = { sponsor: 'success', supplier: 'info', institution: 'warning', other: 'neutral' }

export default function PartnerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)

  const { data: partner, isLoading, isError, error, refetch } = usePartner(id)
  const { data: emailData } = useEmailLogs({ partner: id, page_size: 20 })
  const updateMut = useUpdatePartner()

  const emailLogs = emailData?.results || emailData || []

  const form = useForm({
    resolver: zodResolver(partnerSchema),
  })

  const openEdit = () => {
    if (partner) {
      form.reset({
        name: partner.name || '',
        type: partner.type || 'sponsor',
        contact_person: partner.contact_person || '',
        email: partner.email || '',
        phone: partner.phone || '',
        address: partner.address || '',
        notes: partner.notes || '',
      })
    }
    setEditOpen(true)
  }

  const handleUpdate = (data) => {
    updateMut.mutate({ id, data }, { onSuccess: () => setEditOpen(false) })
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (isError) return <div className="page-container"><ErrorState message={error?.message} onRetry={refetch} /></div>

  const emailColumns = [
    { header: 'Subject', accessorKey: 'subject', cell: ({ getValue }) => <span className="font-medium text-slate-800 truncate max-w-[200px] block">{getValue()}</span> },
    { header: 'Status', accessorKey: 'status', cell: ({ getValue }) => <Badge variant={getValue() === 'sent' ? 'success' : 'danger'}>{getValue()}</Badge> },
    { header: 'Date', accessorKey: 'created_at', cell: ({ getValue }) => formatDateTime(getValue()) },
  ]

  return (
    <div className="page-container">
      <PageHeader title={partner?.name || 'Partner Details'} />
      <div className="flex justify-end -mt-4 gap-2">
        <Button variant="secondary" icon={Pencil} onClick={openEdit}>Edit</Button>
        <Button variant="secondary" icon={Mail} onClick={() => navigate('/communications/compose')}>Send Email</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
              {partner?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{partner?.name}</h3>
              <Badge variant={typeVariant[partner?.type] || 'neutral'}>
                {PARTNER_TYPES.find((t) => t.value === partner?.type)?.label || partner?.type}
              </Badge>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Contact</span><span className="text-slate-800">{partner?.contact_person || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="text-slate-800">{partner?.email || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Phone</span><span className="text-slate-800">{partner?.phone || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Address</span><span className="text-slate-800">{partner?.address || '—'}</span></div>
          </div>
          {partner?.notes && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-700">{partner.notes}</p>
            </div>
          )}
          {partner?.contract_file && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <a href={partner.contract_file} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
                <Download className="h-4 w-4" /> Download Contract
              </a>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Email History</h3>
          <Table columns={emailColumns} data={emailLogs} emptyMessage="No emails sent to this partner" />
        </div>
      </div>

      <Drawer open={editOpen} onClose={() => setEditOpen(false)} title="Edit Partner" side="right" width="md">
        <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
          <Input label="Name" required error={form.formState.errors.name?.message} {...form.register('name')} />
          <Select label="Type" required options={PARTNER_TYPES} error={form.formState.errors.type?.message} {...form.register('type')} />
          <Input label="Contact Person" required error={form.formState.errors.contact_person?.message} {...form.register('contact_person')} />
          <Input label="Email" type="email" required error={form.formState.errors.email?.message} {...form.register('email')} />
          <Input label="Phone" error={form.formState.errors.phone?.message} {...form.register('phone')} />
          <Input label="Address" error={form.formState.errors.address?.message} {...form.register('address')} />
          <Textarea label="Notes" rows={3} error={form.formState.errors.notes?.message} {...form.register('notes')} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" loading={updateMut.isPending}>Update</Button>
          </div>
        </form>
      </Drawer>
    </div>
  )
}
