// ── src/pages/grades/TranscriptPage.jsx ──────────────────
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useStudent, useTranscript } from '@/hooks/useStudents'
import { useSendEmail } from '@/hooks/useCommunications'
import { formatDate, formatGPA, gradeColor } from '@/utils/formatters'
import { useState } from 'react'

export default function TranscriptPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [sendConfirm, setSendConfirm] = useState(false)

  const { data: student, isLoading: sl } = useStudent(id)
  const { data: transcriptData, isLoading: tl, isError, error, refetch } = useTranscript(id)
  const sendEmail = useSendEmail()

  const isLoading = sl || tl

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (isError) return <div className="page-container"><ErrorState message={error?.message} onRetry={refetch} /></div>

  // Transcript returns { modules: [{ module_name, grades: [...] }] }
  // Flatten into a single grades array with module_name on each grade
  const grades = (transcriptData?.modules || []).flatMap((m) =>
    (m.grades || []).map((g) => ({ ...g, module_name: m.module_name }))
  )

  const byCourse = grades.reduce((acc, g) => {
    const key = g.course_title || 'General'
    if (!acc[key]) acc[key] = { grades: [] }
    acc[key].grades.push(g)
    return acc
  }, {})

  const handleSendTranscript = () => {
    sendEmail.mutate({
      recipient_type: 'students',
      recipient_ids: [id],
      subject: `Transcript for ${student?.first_name} ${student?.last_name}`,
      body: `Please find attached the transcript for ${student?.first_name} ${student?.last_name}.`,
    }, { onSuccess: () => setSendConfirm(false) })
  }

  return (
    <div className="page-container">
      <PageHeader title="Transcript" />
      <div className="flex items-center justify-between -mt-4">
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(`/students/${id}`)}>Back to Student</Button>
        <Button variant="secondary" icon={Mail} onClick={() => setSendConfirm(true)}>Send Transcript by Email</Button>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{student?.first_name} {student?.last_name}</h2>
            <p className="text-sm text-slate-500">Year Enrolled: {student?.year_enrolled || '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Overall Average</p>
            <p className="text-3xl font-bold text-primary-600">{formatGPA(grades)}</p>
          </div>
        </div>
      </div>

      {Object.keys(byCourse).length === 0 && (
        <div className="card text-center py-8 text-sm text-slate-500">No courses or grades on record</div>
      )}

      {Object.entries(byCourse).map(([courseName, courseData]) => (
        <div key={courseName} className="card">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">{courseName}</h3>
            <p className="text-xs text-slate-500">{courseData.grades.length} grade record{courseData.grades.length !== 1 ? 's' : ''}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-2 text-left text-xs font-semibold text-slate-500">Module</th>
                <th className="py-2 text-left text-xs font-semibold text-slate-500">Exam</th>
                <th className="py-2 text-center text-xs font-semibold text-slate-500">Mark</th>
                <th className="py-2 text-center text-xs font-semibold text-slate-500">Grade</th>
                <th className="py-2 text-center text-xs font-semibold text-slate-500">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {courseData.grades.map((g, i) => (
                <tr key={i}>
                  <td className="py-2 text-slate-700">{g.module_name}</td>
                  <td className="py-2 text-slate-600">{g.exam_type}</td>
                  <td className="py-2 text-center font-medium">{g.mark}</td>
                  <td className="py-2 text-center">
                    {g.grade_letter && <Badge variant={gradeColor(g.grade_letter)}>{g.grade_letter}</Badge>}
                  </td>
                  <td className="py-2 text-center">
                    <Badge variant={parseFloat(g.mark) >= 50 ? 'success' : 'danger'}>
                      {parseFloat(g.mark) >= 50 ? 'Pass' : 'Fail'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <ConfirmDialog
        open={sendConfirm}
        onClose={() => setSendConfirm(false)}
        onConfirm={handleSendTranscript}
        title="Send Transcript"
        message={`Send transcript to ${student?.email}?`}
        variant="primary"
        confirmLabel="Send"
        loading={sendEmail.isPending}
      />
    </div>
  )
}
