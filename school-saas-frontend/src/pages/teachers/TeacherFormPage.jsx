// ── src/pages/teachers/TeacherFormPage.jsx ────────────────
import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/api/axios'
import PageHeader from '@/components/layout/PageHeader'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import FileUpload from '@/components/ui/FileUpload'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { teacherCreateSchema, teacherEditSchema } from '@/utils/validators'
import { CONTRACT_TYPES } from '@/utils/constants'

export default function TeacherFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teachers', id],
    queryFn: () => api.get(`/api/v1/users/${id}/`).then((r) => r.data),
    enabled: !!id,
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/api/v1/teachers/', data).then((r) => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teachers'] }); toast.success('Teacher created successfully') },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to create teacher'),
  })

  const updateMutation = useMutation({
    mutationFn: (data) => api.patch(`/api/v1/users/${id}/`, data).then((r) => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teachers'] }); toast.success('Teacher updated successfully') },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to update teacher'),
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEdit ? teacherEditSchema : teacherCreateSchema),
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      password: '',
      specialization: '',
      contract_type: 'full_time',
      bio: '',
      qualifications: '',
      can_teach_online: false,
    },
  })

  useEffect(() => {
    if (teacher && isEdit) {
      const tp = teacher.teacher_profile || {}
      reset({
        email: teacher.email || '',
        first_name: teacher.first_name || '',
        last_name: teacher.last_name || '',
        phone: teacher.phone || '',
        password: '',
        specialization: tp.specialization || '',
        contract_type: tp.contract_type || 'full_time',
        bio: tp.bio || '',
        qualifications: tp.qualifications || '',
        can_teach_online: tp.can_teach_online || false,
      })
    }
  }, [teacher, isEdit, reset])

  const onSubmit = (data) => {
    if (isEdit) {
      const { specialization, contract_type, bio, qualifications, can_teach_online, password, ...userFields } = data
      const payload = {
        ...userFields,
        teacher_profile: { specialization, contract_type, bio, qualifications, can_teach_online },
      }
      updateMutation.mutate(payload, { onSuccess: () => navigate(`/teachers/${id}`) })
    } else {
      createMutation.mutate(data, { onSuccess: (res) => navigate(`/teachers/${res.id || ''}`) })
    }
  }

  if (isEdit && isLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="page-container">
      <PageHeader title={isEdit ? 'Edit Teacher' : 'New Teacher'} />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div className="form-section">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Account</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First Name" required error={errors.first_name?.message} {...register('first_name')} />
            <Input label="Last Name" required error={errors.last_name?.message} {...register('last_name')} />
            <Input label="Email" type="email" required error={errors.email?.message} {...register('email')} />
            <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
            {!isEdit && (
              <Input label="Password" type="password" required error={errors.password?.message} {...register('password')} />
            )}
          </div>
        </div>

        <div className="form-section">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Specialization" error={errors.specialization?.message} {...register('specialization')} />
            <Select label="Contract Type" required options={CONTRACT_TYPES} error={errors.contract_type?.message} {...register('contract_type')} />
          </div>
          <Textarea label="Bio" rows={3} error={errors.bio?.message} {...register('bio')} />
          <Textarea label="Qualifications" rows={3} error={errors.qualifications?.message} {...register('qualifications')} />
          <label className="flex items-center gap-2 mt-2">
            <input type="checkbox" className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" {...register('can_teach_online')} />
            <span className="text-sm text-slate-700">Can teach online</span>
          </label>
        </div>

        <div className="form-section">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Photo</h3>
          <FileUpload accept="image/*" maxSizeMB={5} label="Profile Photo" onFileSelect={(file) => setValue('photo', file)} />
        </div>

        <div className="flex items-center gap-3 justify-end">
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" loading={isPending}>{isEdit ? 'Update Teacher' : 'Create Teacher'}</Button>
        </div>
      </form>
    </div>
  )
}
