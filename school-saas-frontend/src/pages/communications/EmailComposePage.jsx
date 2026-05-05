// ── src/pages/communications/EmailComposePage.jsx ────────
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Send, X } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import SearchInput from '@/components/ui/SearchInput'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { useSendEmail } from '@/hooks/useCommunications'
import { useStudents } from '@/hooks/useStudents'
import { useTeachers } from '@/hooks/useTeachers'
import { usePartners } from '@/hooks/usePartners'
import { bulkEmailSchema } from '@/utils/validators'
import { RECIPIENT_TYPES } from '@/utils/constants'

export default function EmailComposePage() {
  const navigate = useNavigate()
  const [recipientSearch, setRecipientSearch] = useState('')
  const [selectedRecipients, setSelectedRecipients] = useState([])
  const [customEmails, setCustomEmails] = useState([])
  const [customInput, setCustomInput] = useState('')

  const sendMutation = useSendEmail()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bulkEmailSchema),
    defaultValues: {
      recipient_type: 'students',
      recipient_ids: [],
      subject: '',
      body: '',
    },
  })

  const recipientType = watch('recipient_type')
  const body = watch('body')

  const { data: studentsData } = useStudents({ search: recipientSearch, page_size: 10 })
  const { data: teachersData } = useTeachers({ search: recipientSearch, page_size: 10 })
  const { data: partnersData } = usePartners({ search: recipientSearch, page_size: 10 })

  const getSearchResults = () => {
    if (recipientType === 'students') return studentsData?.results || studentsData || []
    if (recipientType === 'teachers') return teachersData?.results || teachersData || []
    if (recipientType === 'partners') return partnersData?.results || partnersData || []
    return []
  }

  const searchResults = getSearchResults()

  const addRecipient = (item) => {
    const name = item.first_name
      ? `${item.first_name} ${item.last_name}`
      : item.name || item.email
    if (!selectedRecipients.find((r) => r.id === item.id)) {
      const updated = [...selectedRecipients, { id: item.id, name, email: item.email }]
      setSelectedRecipients(updated)
      setValue(
        'recipient_ids',
        updated.map((r) => r.id)
      )
    }
    setRecipientSearch('')
  }

  const removeRecipient = (id) => {
    const updated = selectedRecipients.filter((r) => r.id !== id)
    setSelectedRecipients(updated)
    setValue(
      'recipient_ids',
      updated.map((r) => r.id)
    )
  }

  const addCustomEmail = () => {
    const email = customInput.trim()
  if (email && /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email) && !customEmails.includes(email)) {
      const updated = [...customEmails, email]
      setCustomEmails(updated)
      setValue('recipient_ids', updated)
      setCustomInput('')
    }
  }

  const removeCustomEmail = (email) => {
    const updated = customEmails.filter((e) => e !== email)
    setCustomEmails(updated)
    setValue('recipient_ids', updated)
  }

  const onSubmit = (data) => {
    sendMutation.mutate(data, {
      onSuccess: () => navigate('/communications/logs'),
    })
  }

  return (
    <div className="page-container">
      <PageHeader title="Compose Email" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="form-section">
            <h3 className="text-base font-semibold text-slate-800 mb-4">Recipients</h3>

            <Select
              label="Recipient Type"
              required
              options={RECIPIENT_TYPES}
              error={errors.recipient_type?.message}
              {...register('recipient_type')}
              onChange={(e) => {
                setValue('recipient_type', e.target.value)
                setSelectedRecipients([])
                setCustomEmails([])
                setValue('recipient_ids', [])
                setRecipientSearch('')
              }}
            />

            {recipientType !== 'custom' ? (
              <div className="mt-3">
                <SearchInput
                  value={recipientSearch}
                  onChange={setRecipientSearch}
                  placeholder={`Search ${recipientType}...`}
                />
                {recipientSearch && searchResults.length > 0 && (
                  <div className="mt-1 border border-slate-200 rounded-lg max-h-40 overflow-y-auto bg-white shadow-sm">
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => addRecipient(item)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                      >
                        {item.first_name
                          ? `${item.first_name} ${item.last_name}`
                          : item.name}{' '}
                        — {item.email}
                      </button>
                    ))}
                  </div>
                )}

                {selectedRecipients.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedRecipients.map((r) => (
                      <span
                        key={r.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary-50 text-primary-700 rounded-full"
                      >
                        {r.name}
                        <button type="button" onClick={() => removeRecipient(r.id)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="email@example.com"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCustomEmail()
                      }
                    }}
                  />
                  <Button type="button" variant="secondary" onClick={addCustomEmail}>
                    Add
                  </Button>
                </div>
                {customEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {customEmails.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary-50 text-primary-700 rounded-full"
                      >
                        {email}
                        <button type="button" onClick={() => removeCustomEmail(email)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {errors.recipient_ids && (
              <p className="mt-1 text-xs text-red-500">{errors.recipient_ids.message}</p>
            )}
          </div>

          <div className="form-section">
            <h3 className="text-base font-semibold text-slate-800 mb-4">Message</h3>
            <Input
              label="Subject"
              required
              error={errors.subject?.message}
              {...register('subject')}
            />
            <Textarea
              label="Body"
              required
              rows={10}
              error={errors.body?.message}
              {...register('body')}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" icon={Send} loading={sendMutation.isPending}>
              Send Email
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-800">Preview</h3>
          <div className="card min-h-[300px]">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <p className="text-xs text-slate-500">To:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {recipientType !== 'custom'
                  ? selectedRecipients.map((r) => (
                      <Badge key={r.id} variant="info" size="sm">
                        {r.name}
                      </Badge>
                    ))
                  : customEmails.map((e) => (
                      <Badge key={e} variant="info" size="sm">
                        {e}
                      </Badge>
                    ))}
                {selectedRecipients.length === 0 && customEmails.length === 0 && (
                  <span className="text-xs text-slate-400">No recipients selected</span>
                )}
              </div>
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-3">
              {watch('subject') || 'Subject line here...'}
            </h4>
            <div className="text-sm text-slate-600 whitespace-pre-wrap">
              {body || 'Email body content will appear here...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
