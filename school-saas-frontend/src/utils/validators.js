// ── src/utils/validators.js ─────────────────────────────
import { z } from 'zod'

// ── Shared helpers ──────────────────────────────────────
const phoneRegex = /^\+?[0-9\s\-]{7,20}$/
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const phoneField = z
  .string()
  .max(20, 'Phone must be at most 20 characters')
  .regex(phoneRegex, 'Invalid phone number format')
  .or(z.literal(''))
  .optional()

const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Must contain at least one digit')
  .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character')

// ── Login ───────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// ── Students ────────────────────────────────────────────
export const studentSchema = z.object({
  first_name: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(100, 'First name must be at most 100 characters'),
  last_name: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(100, 'Last name must be at most 100 characters'),
  email: z.string().email('Invalid email address'),
  date_of_birth: z.string().refine(
    (val) => {
      const d = new Date(val)
      return d < new Date() && d < new Date('2020-01-01')
    },
    'Birthday must be before 2020'
  ),
  national_id: z
    .string()
    .min(5, 'National ID must be at least 5 characters')
    .max(50, 'National ID must be at most 50 characters'),
  phone: phoneField,
  year_enrolled: z
    .number({ invalid_type_error: 'Must be a number' })
    .int()
    .min(2000, 'Year must be 2000 or later')
    .max(new Date().getFullYear(), 'Cannot be in the future'),
  status: z.enum(['active', 'suspended', 'graduated', 'dropped']),
})

// ── Courses ─────────────────────────────────────────────
export const courseSchema = z
  .object({
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title must be at most 200 characters'),
    description: z.string().max(5000, 'Description is too long').optional(),
    type: z.enum(['online', 'offline']),
    level: z
      .string()
      .min(1, 'Level is required')
      .max(100, 'Level must be at most 100 characters'),
    capacity: z
      .number({ invalid_type_error: 'Must be a number' })
      .int()
      .min(1, 'Capacity must be at least 1')
      .max(500, 'Capacity must be at most 500'),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    teacher: z.string().min(1, 'Teacher is required'),
    status: z.enum(['draft', 'active', 'completed', 'cancelled']).default('draft'),
    location: z.string().max(200, 'Location must be at most 200 characters').optional(),
    virtual_link: z
      .string()
      .url('Must be a valid URL')
      .max(500, 'Virtual link must be at most 500 characters')
      .or(z.literal(''))
      .optional(),
    quota: z
      .number({ invalid_type_error: 'Must be a number' })
      .int()
      .min(1)
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'online' && !data.virtual_link) {
      ctx.addIssue({
        path: ['virtual_link'],
        code: z.ZodIssueCode.custom,
        message: 'Required for online courses',
      })
    }
    if (data.type === 'offline' && !data.location) {
      ctx.addIssue({
        path: ['location'],
        code: z.ZodIssueCode.custom,
        message: 'Required for offline courses',
      })
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (data.start_date && new Date(data.start_date) < today) {
      ctx.addIssue({
        path: ['start_date'],
        code: z.ZodIssueCode.custom,
        message: 'Start date cannot be in the past',
      })
    }
    if (data.end_date && data.start_date && new Date(data.end_date) <= new Date(data.start_date)) {
      ctx.addIssue({
        path: ['end_date'],
        code: z.ZodIssueCode.custom,
        message: 'Must be after start date',
      })
    }
    if (data.quota != null && data.capacity && data.quota > data.capacity) {
      ctx.addIssue({
        path: ['quota'],
        code: z.ZodIssueCode.custom,
        message: 'Quota cannot exceed capacity',
      })
    }
  })

// ── Exams (create) ─────────────────────────────────────
export const examSchema = z.object({
  course: z.string().min(1, 'Please select a course'),
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be at most 200 characters'),
  module_name: z
    .string()
    .min(2, 'Module name must be at least 2 characters')
    .max(200, 'Module name must be at most 200 characters'),
  exam_type: z.enum(['midterm', 'final', 'quiz', 'project']),
})

// ── Bulk Email ──────────────────────────────────────────
export const bulkEmailSchema = z.object({
  recipient_type: z.enum(['students', 'teachers', 'partners', 'custom']),
  recipient_ids: z
    .array(z.string())
    .min(1, 'Select at least one recipient')
    .max(200, 'Cannot exceed 200 recipients'),
  subject: z
    .string()
    .min(3, 'Subject must be at least 3 characters')
    .max(300, 'Subject must be at most 300 characters'),
  body: z
    .string()
    .min(10, 'Body must be at least 10 characters')
    .max(10000, 'Body is too long'),
})

// ── Sessions ────────────────────────────────────────────
export const sessionSchema = z.object({
  scheduled_at: z.string().min(1, 'Date and time is required').refine(
    (val) => new Date(val) > new Date(),
    'Session date cannot be in the past'
  ),
  duration_minutes: z
    .number({ invalid_type_error: 'Must be a number' })
    .int()
    .min(1, 'Duration must be at least 1 minute')
    .max(480, 'Duration must be at most 480 minutes (8 hours)'),
  notes: z.string().max(2000, 'Notes are too long').optional(),
})

// ── Teachers (create) ───────────────────────────────────
export const teacherCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  first_name: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(100, 'First name must be at most 100 characters'),
  last_name: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(100, 'Last name must be at most 100 characters'),
  phone: phoneField,
  password: passwordField,
  specialization: z.string().max(200, 'Specialization must be at most 200 characters').optional(),
  contract_type: z.enum(['full_time', 'part_time', 'freelance']),
  bio: z.string().max(2000, 'Bio is too long').optional(),
  qualifications: z.string().max(2000, 'Qualifications text is too long').optional(),
  can_teach_online: z.boolean().optional(),
})

// ── Teachers (edit) ─────────────────────────────────────
export const teacherEditSchema = z.object({
  email: z.string().email('Invalid email address'),
  first_name: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(100, 'First name must be at most 100 characters'),
  last_name: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(100, 'Last name must be at most 100 characters'),
  phone: phoneField,
  specialization: z.string().max(200, 'Specialization must be at most 200 characters').optional(),
  contract_type: z.enum(['full_time', 'part_time', 'freelance']),
  bio: z.string().max(2000, 'Bio is too long').optional(),
  qualifications: z.string().max(2000, 'Qualifications text is too long').optional(),
  can_teach_online: z.boolean().optional(),
})

// ── Partners ────────────────────────────────────────────
export const partnerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must be at most 200 characters'),
  type: z.enum(['company', 'institution', 'ngo', 'other'], {
    errorMap: () => ({ message: 'Please select a valid partner type' }),
  }),
  contact_person: z
    .string()
    .min(2, 'Contact person is required')
    .max(200, 'Contact person must be at most 200 characters'),
  email: z.string().email('Invalid email address'),
  phone: phoneField,
  notes: z.string().max(2000, 'Notes are too long').optional(),
})

// ── Enrollments ─────────────────────────────────────────
export const enrollmentSchema = z.object({
  student: z.string().min(1, 'Student is required'),
  payment_status: z.enum(['paid', 'pending', 'overdue']),
})

// ── Resources ───────────────────────────────────────────
export const resourceSchema = z
  .object({
    title: z
      .string()
      .min(2, 'Title must be at least 2 characters')
      .max(200, 'Title must be at most 200 characters'),
    course: z.string().min(1, 'Course is required'),
    resource_type: z.enum(['pdf', 'video', 'slide', 'link', 'other']),
    external_url: z
      .string()
      .url('Must be a valid URL')
      .or(z.literal(''))
      .optional(),
    has_file: z.boolean().optional(),
  })
  .refine(
    (data) => data.has_file || (data.external_url && data.external_url !== ''),
    {
      message: 'Either a file or an external URL must be provided',
      path: ['external_url'],
    }
  )

// ── Change Password ─────────────────────────────────────
export const changePasswordSchema = z
  .object({
    old_password: z.string().min(8, 'Must be at least 8 characters'),
    new_password: passwordField,
    confirm_password: z.string().min(8, 'Must be at least 8 characters'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })
  .refine((data) => data.new_password !== data.old_password, {
    message: 'New password must be different from old password',
    path: ['new_password'],
  })
