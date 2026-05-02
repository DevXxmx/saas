<!-- ── apps/attendance/README.md ───────────────────────────── -->

# Attendance App

## Purpose

Tracks student presence per course session. Automatically detects 3 consecutive absences and triggers a warning email to the student plus a notification to all admin users.

## Models

| Model | Key Fields | Notes |
|---|---|---|
| `Attendance` | `session`, `enrollment`, `status`, `consecutive_absences` | `unique_together`: (`session`, `enrollment`). Status: `present`, `absent`, `late`, `excused`. |

## How consecutive_absences Works

A `post_save` signal fires every time an `Attendance` record is saved. It queries all `Attendance` records for that enrollment, ordered by `session__scheduled_at` descending, and counts the unbroken streak of `absent` records from the most recent entry backwards. The result is stored on the record using `update()` to avoid triggering the signal recursively.

When the count reaches exactly 3:
1. The `send_absence_warning_email` Celery task is dispatched.
2. A `Notification` is created for every active admin user.

## API Endpoints

| Method | URL | Permission | Description |
|---|---|---|---|
| `POST` | `/api/v1/attendance/bulk/` | Teacher (own course) | Bulk mark attendance for a session |
| `GET` | `/api/v1/attendance/session/{sid}/` | Authenticated | List attendance records for a session |
| `GET` | `/api/v1/attendance/student/{stid}/` | Admin, HR | Full attendance history for a student |

## Bulk Mark Payload

```json
{
  "session_id": "uuid",
  "records": [
    { "enrollment_id": "uuid", "status": "present" },
    { "enrollment_id": "uuid", "status": "absent" }
  ]
}
```

The view creates or updates one `Attendance` record per entry using `update_or_create`. Enrollments not included in the payload are left unchanged.

## Business Rules

- Only the teacher assigned to the course can mark attendance for its sessions.
- Attendance can be re-submitted to correct mistakes. The signal recomputes `consecutive_absences` on every save.
- `status='excused'` does not count as an absence — it breaks the consecutive absence streak.
