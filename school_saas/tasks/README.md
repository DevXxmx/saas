<!-- ── tasks/README.md ─────────────────────────────────────── -->

# Background Tasks

## Purpose

All asynchronous and scheduled work runs through Celery. Redis is used as both the broker and result backend. `django-celery-beat` manages periodic task scheduling via the database.

## Task Files

| File | Contents |
|---|---|
| `email_tasks.py` | All email-sending tasks (session link, absence, payment, bulk) |
| `scheduling_tasks.py` | Cleanup of expired scheduled tasks |
| `beat_schedule.py` | Celery Beat periodic task definitions |

## Task Reference

### `send_session_link_email(session_id)`

- **Trigger**: Celery ETA, 30 minutes before `session.scheduled_at`.
- **Scheduled by**: `post_save` signal on `CourseSession` (online courses only).
- **Logic**:
  1. Load `CourseSession`. Skip if `link_sent=True`.
  2. Query paid, active `Enrollment` records for the course.
  3. Render `session_link.html` for each student.
  4. Send via SendGrid. Create `EmailLog`. Set `link_sent=True`.
- **Retry**: Up to 3 times, 60-second delay on SendGrid failure.

### `send_absence_warning_email(enrollment_id)`

- **Trigger**: `post_save` signal on `Attendance`, when `consecutive_absences` reaches exactly 3.
- **Logic**:
  1. Load `Enrollment` → `Student` + `Course`.
  2. Render `absence_warning.html`.
  3. Send to `student.email`. Create `EmailLog`.
- **Retry**: Up to 3 times, 60-second delay.

### `send_payment_reminder_email()`

- **Trigger**: Celery Beat, daily at 09:00 Africa/Algiers.
- **Logic**:
  1. Query all `Enrollment` records where `payment_status='overdue'` and `is_active=True`.
  2. Render `payment_reminder.html` for each.
  3. Send and create `EmailLog` per student.
- **Retry**: Up to 3 times, 60-second delay.

### `send_bulk_email(subject, body, recipient_emails, log_id)`

- **Trigger**: Manual — called by `BulkEmailView` after creating `EmailLog`.
- **Logic**:
  1. Send to each address in `recipient_emails` via SendGrid.
  2. Update `EmailLog` status to `'sent'` or `'failed'`.
- **Retry**: Up to 3 times, 60-second delay.

## Running Workers

**Development** (one terminal each):

```bash
celery -A config.celery worker -l info
celery -A config.celery beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

**Production**: Run worker and beat as separate systemd services. Never run beat twice — duplicate scheduling will cause double emails.

## ScheduledTask Table

Every ETA task (session link) writes a `ScheduledTask` row to PostgreSQL before dispatching to Redis. This ensures jobs survive a Redis restart. On execution, the row is updated to `status='done'`. Stale `'pending'` rows older than 24 hours can be safely cleaned up via `cleanup_expired_scheduled_tasks`.
