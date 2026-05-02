// ── src/pages/audit/AuditLogPage.jsx ─────────────────────
import { useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import FilterBar from '@/components/shared/FilterBar'
import SearchInput from '@/components/ui/SearchInput'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Table from '@/components/ui/Table'
import Pagination from '@/components/ui/Pagination'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Drawer from '@/components/ui/Drawer'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import { useAuditLogs } from '@/hooks/useAudit'
import { formatDateTime } from '@/utils/formatters'
import { AUDIT_ACTIONS } from '@/utils/constants'
import { extractList, extractCount } from '@/utils/queryHelpers'

// Badge colour per action
const actionVariant = {
  create:  'success',
  update:  'info',
  delete:  'danger',
  login:   'neutral',
  lock:    'warning',
  unlock:  'neutral',
}

// Human-readable label for each action
const actionLabel = {
  create:  'Create',
  update:  'Update',
  delete:  'Delete',
  login:   '🔑 Login',
  lock:    '🔒 Account Locked',
  unlock:  '🔓 Account Unlocked',
}

// Human-friendly model names
const MODEL_LABELS = {
  Student:      'Student',
  Course:       'Course',
  CourseSession:'Session',
  Enrollment:   'Enrollment',
  Attendance:   'Attendance',
  Grade:        'Grade',
  Exam:         'Exam',
  EmailLog:     'Email',
  Resource:     'Resource',
  Partner:      'Partner',
  CustomUser:   'User Account',
  Teacher:      'Teacher',
}

const MODEL_OPTIONS = Object.entries(MODEL_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export default function AuditLogPage() {
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('')
  const [model, setModel] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)

  const params = {
    page,
    page_size: 15,
    search: search || undefined,
    action: action || undefined,
    model_affected: model || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  }

  const { data, isLoading, isError, error, refetch } = useAuditLogs(params)

  const logs = extractList(data)
  const total = extractCount(data)

  const handleRowClick = (row) => {
    setSelectedLog(row)
    setDrawerOpen(true)
  }

  if (isError)
    return (
      <div className="page-container">
        <ErrorState message={error?.message} onRetry={refetch} />
      </div>
    )

  // ── Helpers ─────────────────────────────────────────────

  /**
   * Returns a human-readable label for the audited object.
   * Prefers `object_repr` (stored as str(instance)), falls back to the raw ID.
   */
  const getObjectLabel = (log) => {
    if (log.object_repr && log.object_repr.trim()) return log.object_repr
    return log.object_id || '—'
  }

  /** Pretty-print the changes JSON in the drawer. */
  const formatChanges = (changes) => {
    if (!changes) return null
    if (typeof changes === 'string') {
      try { changes = JSON.parse(changes) } catch {
        return <pre className="text-xs text-slate-600 whitespace-pre-wrap">{changes}</pre>
      }
    }
    if (typeof changes === 'object') {
      return (
        <div className="space-y-2">
          {Object.entries(changes).map(([key, value]) => (
            <div key={key} className="flex gap-2 text-xs">
              <span className="font-mono font-medium text-slate-700 min-w-[130px]">
                {key}:
              </span>
              <div className="flex-1">
                {typeof value === 'object' && value !== null ? (
                  <div className="space-y-0.5">
                    {value.old !== undefined && (
                      <div className="flex gap-1">
                        <span className="text-red-500 font-mono">−</span>
                        <span className="text-red-600">{JSON.stringify(value.old)}</span>
                      </div>
                    )}
                    {value.new !== undefined && (
                      <div className="flex gap-1">
                        <span className="text-emerald-500 font-mono">+</span>
                        <span className="text-emerald-600">{JSON.stringify(value.new)}</span>
                      </div>
                    )}
                    {value.value !== undefined && (
                      <span className="text-slate-600">{JSON.stringify(value.value)}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-600">{JSON.stringify(value)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  // ── Table columns ────────────────────────────────────────

  const columns = [
    {
      header: 'Timestamp',
      accessorKey: 'timestamp',
      cell: ({ getValue }) => (
        <span className="text-xs text-slate-600 whitespace-nowrap">
          {formatDateTime(getValue())}
        </span>
      ),
    },
    {
      header: 'User',
      accessorKey: 'user_display',
      cell: ({ row }) => {
        const log = row.original
        const name = log.user_display || log.user_email || 'System'
        return (
          <div className="flex items-center gap-2">
            <Avatar name={name} size="sm" />
            <span className="text-sm text-slate-700">{name}</span>
          </div>
        )
      },
    },
    {
      header: 'Action',
      accessorKey: 'action',
      cell: ({ getValue }) => {
        const val = getValue()
        return (
          <Badge variant={actionVariant[val] || 'neutral'}>
            {actionLabel[val] || val}
          </Badge>
        )
      },
    },
    {
      header: 'Model',
      accessorKey: 'model_affected',
      cell: ({ getValue }) => (
        <span className="text-sm font-medium text-slate-700">
          {MODEL_LABELS[getValue()] || getValue()}
        </span>
      ),
    },
    {
      header: 'Object',
      accessorKey: 'object_repr',
      cell: ({ row }) => (
        <span className="text-sm text-slate-600 truncate max-w-[180px] block">
          {getObjectLabel(row.original)}
        </span>
      ),
    },
    {
      header: 'Changes',
      accessorKey: 'changes',
      cell: ({ getValue }) => {
        const changes = getValue()
        if (!changes) return <span className="text-xs text-slate-400">—</span>
        const summary =
          typeof changes === 'object'
            ? Object.keys(changes).slice(0, 3).join(', ')
            : String(changes).substring(0, 40)
        return (
          <span className="text-xs text-slate-500 truncate max-w-[160px] block">
            {summary}
          </span>
        )
      },
    },
  ]

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="page-container">
      <PageHeader title="Audit Log" subtitle="Track all changes across the system" />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1) }}
          placeholder="Search by user..."
          className="w-56"
        />
        <Select
          options={[{ value: '', label: 'All Models' }, ...MODEL_OPTIONS]}
          value={model}
          onChange={(e) => { setModel(e.target.value); setPage(1) }}
        />
        <Select
          options={[{ value: '', label: 'All Actions' }, ...AUDIT_ACTIONS]}
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1) }}
        />
        <div className="flex items-end gap-2">
          <Input
            label="From"
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
          />
          <Input
            label="To"
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
          />
        </div>
      </FilterBar>

      <Table
        columns={columns}
        data={logs}
        loading={isLoading}
        emptyMessage="No audit logs found"
        onRowClick={handleRowClick}
      />
      <Pagination page={page} pageSize={15} total={total} onPageChange={setPage} />

      {/* ── Detail drawer ────────────────────────────────── */}
      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedLog(null) }}
        title="Audit Log Details"
        side="right"
        width="md"
      >
        {selectedLog ? (
          <div className="space-y-5">

            {/* Action + model badge row */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge
                variant={actionVariant[selectedLog.action] || 'neutral'}
                size="md"
              >
                {actionLabel[selectedLog.action] || selectedLog.action}
              </Badge>
              <span className="text-sm font-medium text-slate-700">
                {MODEL_LABELS[selectedLog.model_affected] || selectedLog.model_affected}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              {/* Timestamp */}
              <div>
                <p className="text-xs font-medium text-slate-500">Timestamp</p>
                <p className="text-slate-800">{formatDateTime(selectedLog.timestamp)}</p>
              </div>

              {/* User */}
              <div>
                <p className="text-xs font-medium text-slate-500">Performed by</p>
                <p className="text-slate-800">
                  {selectedLog.user_display || selectedLog.user_email || 'System'}
                </p>
              </div>

              {/* Object — human-readable */}
              <div>
                <p className="text-xs font-medium text-slate-500">Object</p>
                <p className="text-slate-800">{getObjectLabel(selectedLog)}</p>
              </div>

              {/* IP */}
              {selectedLog.ip_address && (
                <div>
                  <p className="text-xs font-medium text-slate-500">IP Address</p>
                  <p className="font-mono text-slate-800">{selectedLog.ip_address}</p>
                </div>
              )}
            </div>

            {/* Changes */}
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Changes</p>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                {formatChanges(selectedLog.changes) || (
                  <span className="text-xs text-slate-400">No changes recorded</span>
                )}
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
