<!-- ── apps/communications/README.md ───────────────────────── -->

# Communications App

## Purpose

Handles all outbound emails and in-platform notifications. Provides a complete log of every email ever sent from the platform, whether triggered manually by admin or automatically by the system.

## Models

| Model | Key Fields | Notes |
|---|---|---|
| `EmailLog` | `subject`, `trigger_type`, `recipient_ids`, `status`, `sent_at`, `sent_by` | One record per send operation (bulk or single). `status`: `pending`, `sent`, `failed`. |
| `Notification` | `recipient` (FK→CustomUser), `title`, `body`, `notif_type`, `is_read` | In-platform only. For staff and teachers, not students. |

## Email Trigger Types

| trigger_type | Who sends it | When |
|---|---|---|
| `bulk` | Admin (manual) | Admin composes and sends via API |
| `session_link` | System (Celery) | 30 min before online session |
| `absence_warning` | System (signal) | 3 consecutive absences detected |
| `payment_reminder` | System (beat) | Daily at 09:00, overdue enrollments |
| `enrollment_confirmation` | System (signal) | When enrollment is created |
| `grade_report` | Admin (manual) | When admin sends transcript email |

## API Endpoints

| Method | URL | Permission | Description |
|---|---|---|---|
| `POST` | `/api/v1/emails/send/` | Admin | Send bulk email |
| `GET` | `/api/v1/emails/logs/` | Admin | List email logs |
| `GET` | `/api/v1/emails/logs/{id}/` | Admin | Log detail with recipient list |
| `GET` | `/api/v1/notifications/` | Authenticated | Own notifications |
| `PATCH` | `/api/v1/notifications/{id}/` | Authenticated | Mark as read |
| `POST` | `/api/v1/notifications/mark-all-read/` | Authenticated | Mark all notifications read |

## Bulk Email Payload

```json
{
  "subject": "Important Update",
  "body": "<p>Hello...</p>",
  "recipient_type": "students",
  "recipient_ids": ["uuid1", "uuid2"]
}
```

Valid `recipient_type` values: `students`, `teachers`, `partners`, `custom`.

The view resolves `recipient_ids` to email addresses, dispatches the `send_bulk_email` Celery task, and creates an `EmailLog` record with `status='pending'` before returning `202 Accepted`.

## Notes

- Students have no platform account and receive no `Notification` records. All student communication is email-only.
- Notifications are for admin, HR, and teacher users only.
- `EmailLog.recipient_ids` stores UUIDs as a JSON array. Email addresses are resolved at send time from `Student`, `CustomUser`, or `Partner` tables.
