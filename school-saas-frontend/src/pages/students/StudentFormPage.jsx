// ── src/pages/students/StudentFormPage.jsx ────────────────
import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import PageHeader from '@/components/layout/PageHeader'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import FileUpload from '@/components/ui/FileUpload'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { studentSchema } from '@/utils/validators'
import { STUDENT_STATUSES } from '@/utils/constants'
import { useStudent, useCreateStudent, useUpdateStudent } from '@/hooks/useStudents'

export default function StudentFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: student, isLoading } = useStudent(id)
  const createMutation = useCreateStudent()
  const updateMutation = useUpdateStudent()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      national_id: '',
      year_enrolled: new Date().getFullYear(),
      status: 'active',
    },
  })

  useEffect(() => {
    if (student && isEdit) {
      reset({
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        email: student.email || '',
        phone: student.phone || '',
        date_of_birth: student.date_of_birth || '',
        national_id: student.national_id || '',
        year_enrolled: student.year_enrolled || new Date().getFullYear(),
        status: student.status || 'active',
      })
    }
  }, [student, isEdit, reset])

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id, data }, { onSuccess: () => navigate(`/students/${id}`) })
    } else {
      createMutation.mutate(data, { onSuccess: (res) => navigate(`/students/${res.id || id}`) })
    }
  }

  if (isEdit && isLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="page-container">
      <PageHeader title={isEdit ? 'Edit Student' : 'New Student'} />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div className="form-section">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First Name" required error={errors.first_name?.message} {...register('first_name')} />
            <Input label="Last Name" required error={errors.last_name?.message} {...register('last_name')} />
            <Input label="Email" type="email" required error={errors.email?.message} {...register('email')} />
            <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
            <Input label="Date of Birth" type="date" required error={errors.date_of_birth?.message} {...register('date_of_birth')} />
            <Input label="National ID" required error={errors.national_id?.message} {...register('national_id')} />
          </div>
        </div>

        <div className="form-section">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Academic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Year Enrolled"
              type="number"
              required
              error={errors.year_enrolled?.message}
              {...register('year_enrolled', { valueAsNumber: true })}
            />
            <Select
              label="Status"
              required
              options={STUDENT_STATUSES}
              error={errors.status?.message}
              {...register('status')}
            />
          </div>
        </div>

        <div className="form-section">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Photo</h3>
          <FileUpload accept="image/*" maxSizeMB={5} label="Student Photo" onFileSelect={(file) => setValue('photo', file)} />
        </div>

        <div className="flex items-center gap-3 justify-end">
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" loading={isPending}>{isEdit ? 'Update Student' : 'Create Student'}</Button>
        </div>
      </form>
    </div>
  )
}
