// ── src/pages/courses/CourseFormPage.jsx ──────────────────
import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import PageHeader from '@/components/layout/PageHeader'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { courseSchema } from '@/utils/validators'
import { COURSE_STATUSES } from '@/utils/constants'
import { useCourse, useCreateCourse, useUpdateCourse } from '@/hooks/useCourses'
import { useTeachers } from '@/hooks/useTeachers'

export default function CourseFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: course, isLoading } = useCourse(id)
  const createMutation = useCreateCourse()
  const updateMutation = useUpdateCourse()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'offline',
      level: '',
      capacity: 30,
      start_date: '',
      end_date: '',
      teacher: '',
      status: 'draft',
      location: '',
      virtual_link: '',
      quota: null,
    },
  })

  const courseType = watch('type')

  const teacherParams = courseType === 'online' ? { can_teach_online: true, page_size: 100 } : { page_size: 100 }
  const { data: teachersData } = useTeachers(teacherParams)
  const teachers = teachersData?.results || teachersData || []
  const teacherOptions = teachers.map((t) => {
    // Handle both nested user object (from /teachers/) and flat fields
    const user = t.user || t
    const name = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
    return { value: t.id, label: name }
  })

  useEffect(() => {
    if (course && isEdit) {
      reset({
        title: course.title || '',
        description: course.description || '',
        type: course.type || 'offline',
        level: course.level || '',
        capacity: course.capacity || 30,
        start_date: course.start_date || '',
        end_date: course.end_date || '',
        teacher: course.teacher || '',
        status: course.status || 'draft',
        location: course.location || '',
        virtual_link: course.virtual_link || '',
        quota: course.quota || null,
      })
    }
  }, [course, isEdit, reset])

  const onSubmit = (data) => {
    const payload = { ...data }
    if (payload.type === 'online') {
      delete payload.location
    } else {
      delete payload.virtual_link
      delete payload.quota
    }
    if (isEdit) {
      updateMutation.mutate({ id, data: payload }, { onSuccess: () => navigate(`/courses/${id}`) })
    } else {
      createMutation.mutate(payload, { onSuccess: (res) => navigate(`/courses/${res.id || ''}`) })
    }
  }

  if (isEdit && isLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="page-container">
      <PageHeader title={isEdit ? 'Edit Course' : 'New Course'} />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div className="form-section">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Basic Information</h3>
          <Input label="Title" required error={errors.title?.message} {...register('title')} />
          <Textarea label="Description" rows={3} error={errors.description?.message} {...register('description')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Level" required error={errors.level?.message} {...register('level')} />
            <Select label="Type" required options={[{ value: 'online', label: 'Online' }, { value: 'offline', label: 'Offline' }]} error={errors.type?.message} {...register('type')} />
            <Select label="Status" options={COURSE_STATUSES} error={errors.status?.message} {...register('status')} />
            <Input label="Capacity" type="number" required error={errors.capacity?.message} {...register('capacity', { valueAsNumber: true })} />
          </div>
        </div>

        <div className="form-section">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Schedule</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Start Date" type="date" required error={errors.start_date?.message} {...register('start_date')} />
            <Input label="End Date" type="date" required error={errors.end_date?.message} {...register('end_date')} />
          </div>
        </div>

        <div className="form-section">
          <h3 className="text-base font-semibold text-slate-800 mb-4">
            {courseType === 'online' ? 'Online Details' : 'Location'}
          </h3>
          {courseType === 'offline' ? (
            <Input label="Location" required error={errors.location?.message} {...register('location')} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Virtual Link" type="url" required error={errors.virtual_link?.message} {...register('virtual_link')} />
              <Input label="Quota" type="number" error={errors.quota?.message} {...register('quota', { valueAsNumber: true })} />
            </div>
          )}
        </div>

        <div className="form-section">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Teacher</h3>
          <Select
            label="Assign Teacher"
            required
            placeholder="Select a teacher"
            options={teacherOptions}
            error={errors.teacher?.message}
            {...register('teacher')}
          />
        </div>

        <div className="flex items-center gap-3 justify-end">
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" loading={isPending}>{isEdit ? 'Update Course' : 'Create Course'}</Button>
        </div>
      </form>
    </div>
  )
}
