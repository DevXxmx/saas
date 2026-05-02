<!-- ── templates/emails/README.md ──────────────────────────── -->

# Email Templates

## Structure

All templates extend `base_email.html`. The base template provides a responsive 600px-wide layout with a branded header (school name) and a footer (address, phone, automated message disclaimer). All CSS is inline — no external stylesheets — as required for email client compatibility.

## Template Reference

| Template | Trigger | Key Context Variables |
|---|---|---|
| `base_email.html` | Base layout | `school_name`, `school_address`, `school_phone`, `school_email` |
| `session_link.html` | 30 min before online session | `student_name`, `course_title`, `session_date`, `session_time`, `virtual_link`, `duration_minutes` |
| `absence_warning.html` | 3 consecutive absences | `student_name`, `course_title`, `absence_count`, `school_email`, `school_phone` |
| `payment_reminder.html` | Daily beat (overdue) | `student_name`, `course_title`, `school_email` |
| `enrollment_confirmation.html` | On enrollment | `student_name`, `course_title`, `course_type`, `start_date`, `payment_status`, `next_session_date` |
| `grade_report.html` | Manual send | `student_name`, `course_title`, `grades` (list), `overall_gpa` |

## Rendering

All templates are rendered via `utils/email.py` `render_email()`. Never call `render_to_string` directly in tasks — always use the `render_email` helper to ensure `base_email.html` context variables (school info) are applied.

## Editing Templates

**To customise branding**: Edit the header block in `base_email.html` (background color, school name, logo).

**To change content**: Edit the specific template file. Each template uses Django template blocks (`{% block content %}`) to inject content into the base layout.

**Test rendering locally** with Django shell:

```python
from utils.email import render_email
html = render_email('emails/session_link.html', {
    'student_name': 'Test Student',
    'course_title': 'Python Basics',
    'session_date': 'April 15, 2026',
    'session_time': '10:00 AM',
    'virtual_link': 'https://meet.example.com/abc',
    'duration_minutes': 90,
})
print(html)
```
