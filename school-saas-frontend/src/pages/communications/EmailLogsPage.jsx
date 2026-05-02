// ── src/pages/communications/EmailLogsPage.jsx ───────────
import { useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import FilterBar from '@/components/shared/FilterBar'
import Select from '@/components/ui/Select'
import Table from '@/components/ui/Table'
import Pagination from '@/components/ui/Pagination'
import Badge from '@/components/ui/Badge'
import Drawer from '@/components/ui/Drawer'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import { useEmailLogs, useEmailLog } from '@/hooks/useCommunications'
import { formatDateTime } from '@/utils/formatters'
import { TRIGGER_TYPES, EMAIL_STATUSES, STATUS_VARIANTS, TRIGGER_VARIANTS } from '@/utils/constants'
import { extractList, extractCount } from '@/utils/queryHelpers'


export default function EmailLogsPage() {
  const [triggerType, setTriggerType] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const params = {
    page,
    page_size: 10,
    trigger_type: triggerType || undefined,
    status: status || undefined,
  }
  const { data, isLoading, isError, error, refetch } = useEmailLogs(params)
  const { data: logDetail } = useEmailLog(selectedId)

  const logs = extractList(data)
  const total = extractCount(data)

  const handleRowClick = (row) => {
    setSelectedId(row.id)
    setDrawerOpen(true)
  }

  if (isError)
    return (
      <div className="page-container">
        <ErrorState message={error?.message} onRetry={refetch} />
      </div>
    )

  const columns = [
    {
      header: 'Subject',
      accessorKey: 'subject',
      cell: ({ getValue }) => (
        <span className="font-medium text-slate-800 truncate max-w-[200px] block">
          {getValue()}
        </span>
      ),
    },
    {
      header: 'Trigger',
      accessorKey: 'trigger_type',
      cell: ({ getValue }) => (
        <Badge variant={TRIGGER_VARIANTS[getValue()] || 'neutral'}>
          {TRIGGER_TYPES.find((t) => t.value === getValue())?.label || getValue()}
        </Badge>
      ),
    },
    {
      header: 'Recipients',
      accessorKey: 'recipient_count',
      cell: ({ getValue }) => getValue() ?? '—',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ getValue }) => (
        <Badge variant={STATUS_VARIANTS[getValue()] || 'neutral'}>{getValue()}</Badge>
      ),
    },
    {
      header: 'Sent By',
      accessorKey: 'sent_by_name',
      cell: ({ row }) =>
        row.original.sent_by_name || row.original.sent_by_display || '—',
    },
    {
      header: 'Sent At',
      accessorKey: 'created_at',
      cell: ({ getValue }) => formatDateTime(getValue()),
    },
  ]

  return (
    <div className="page-container">
      <PageHeader title="Email Logs" />

      <FilterBar>
        <Select
          options={[{ value: '', label: 'All Triggers' }, ...TRIGGER_TYPES]}
          value={triggerType}
          onChange={(e) => {
            setTriggerType(e.target.value)
            setPage(1)
          }}
        />
        <Select
          options={[{ value: '', label: 'All Statuses' }, ...EMAIL_STATUSES]}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
        />
      </FilterBar>

      <Table
        columns={columns}
        data={logs}
        loading={isLoading}
        emptyMessage="No email logs found"
        onRowClick={handleRowClick}
      />
      <Pagination page={page} pageSize={10} total={total} onPageChange={setPage} />

      <Drawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedId(null)
        }}
        title="Email Details"
        side="right"
        width="lg"
      >
        {logDetail ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-500">Subject</p>
              <p className="text-base font-semibold text-slate-900">{logDetail.subject}</p>
            </div>
            <div className="flex gap-3">
              <Badge variant={STATUS_VARIANTS[logDetail.status] || 'neutral'}>
                {logDetail.status}
              </Badge>
              <Badge variant={TRIGGER_VARIANTS[logDetail.trigger_type] || 'neutral'}>
                {logDetail.trigger_type}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Sent At</p>
              <p className="text-sm text-slate-700">{formatDateTime(logDetail.created_at)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Recipients</p>
              <div className="flex flex-wrap gap-1">
                {(logDetail.recipient_emails || []).map((email, i) => (
                  <Badge key={i} variant="neutral" size="sm">
                    {email}
                  </Badge>
                ))}
                {!(logDetail.recipient_emails || []).length && (
                  <span className="text-sm text-slate-500">—</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Body</p>
              <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap border border-slate-100">
                {logDetail.body || '—'}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <Spinner size="md" />
          </div>
        )}
      </Drawer>
    </div>
  )
}
