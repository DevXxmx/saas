// ── src/utils/constants.js ─────────────────────────────
export const ROLES = { ADMIN: 'admin', HR: 'hr', TEACHER: 'teacher' }

export const COURSE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const PAYMENT_STATUSES = [
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
]

export const ATTENDANCE_STATUSES = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'excused', label: 'Excused' },
]

export const EXAM_TYPES = [
  { value: 'midterm', label: 'Midterm' },
  { value: 'final', label: 'Final' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'project', label: 'Project' },
]

export const CONTRACT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'freelance', label: 'Freelance' },
]

export const STUDENT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'dropped', label: 'Dropped' },
]

export const RESOURCE_TYPES = [
  { value: 'pdf', label: 'PDF' },
  { value: 'video', label: 'Video' },
  { value: 'slide', label: 'Slide' },
  { value: 'link', label: 'Link' },
  { value: 'other', label: 'Other' },
]

export const RECIPIENT_TYPES = [
  { value: 'students', label: 'Students' },
  { value: 'teachers', label: 'Teachers' },
  { value: 'partners', label: 'Partners' },
  { value: 'custom', label: 'Custom' },
]

export const PARTNER_TYPES = [
  { value: 'company', label: 'Company' },
  { value: 'institution', label: 'Institution' },
  { value: 'ngo', label: 'NGO' },
  { value: 'other', label: 'Other' },
]

export const AUDIT_ACTIONS = [
  { value: 'create',  label: 'Create' },
  { value: 'update',  label: 'Update' },
  { value: 'delete',  label: 'Delete' },
  { value: 'login',   label: 'Login' },
  { value: 'lock',    label: 'Account Locked' },
  { value: 'unlock',  label: 'Account Unlocked' },
]

export const TRIGGER_TYPES = [
  { value: 'bulk', label: 'Bulk' },
  { value: 'absence_warning', label: 'Absence Warning' },
  { value: 'session_link', label: 'Session Link' },
  { value: 'payment_reminder', label: 'Payment Reminder' },
  { value: 'enrollment_confirmation', label: 'Enrollment Confirmation' },
  { value: 'grade_report', label: 'Grade Report' },
]

export const EMAIL_STATUSES = [
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Pending' },
]

// ── Centralized Badge variant mappings ────────────────────
export const STATUS_VARIANTS = {
  // Student statuses
  active: 'success',
  suspended: 'warning',
  graduated: 'info',
  dropped: 'danger',
  // Course statuses
  draft: 'neutral',
  completed: 'info',
  cancelled: 'danger',
  // Email / payment statuses
  sent: 'success',
  failed: 'danger',
  pending: 'warning',
  paid: 'success',
  overdue: 'danger',
  // Attendance
  present: 'success',
  absent: 'danger',
  late: 'warning',
  excused: 'info',
}

export const TRIGGER_VARIANTS = {
  bulk: 'info',
  absence_warning: 'warning',
  session_link: 'neutral',
  payment_reminder: 'warning',
  enrollment_confirmation: 'success',
  grade_report: 'info',
}

