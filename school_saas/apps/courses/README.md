<!-- ── apps/courses/README.md ──────────────────────────────── -->

# Courses App

## Purpose

Manages courses, sessions, and enrollments. Courses can be offline (physical location) or online (virtual link). Each course has one teacher and many enrolled students.

## Models

| Model | Key Fields | Notes |
|---|---|---|
| `Course` | `title`, `type`, `status`, `capacity`, `quota`, `start_date`, `end_date`, `teacher` | `type`: `online`/`offline`. `quota` only used for online courses. |
| `CourseSession` | `course`, `scheduled_at`, `duration_minutes`, `link_sent` | One row per scheduled class meeting. |
| `Enrollment` | `course`, `student`, `payment_status`, `is_active` | `unique_together`: (`course`, `student`). |
| `ScheduledTask` | `task_type`, `payload`, `run_at`, `status`, `celery_task_id` | Tracks Celery ETA tasks for durability. |

## Course Types

- **`offline`**: Requires a location field. No quota. No virtual link.
- **`online`**: Requires `virtual_link` and `quota`. Teacher must have `can_teach_online=True` or the model's `clean()` raises a `ValidationError`.

## Course Statuses

```
draft → active → completed
             ↓
         cancelled   (can transition from any status)
```

## Enrollment Payment Statuses

```
pending → paid
pending → overdue  (set manually by admin or by payment reminder task)
```

## API Endpoints

| Method | URL | Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/courses/` | Authenticated | List courses |
| `POST` | `/api/v1/courses/` | Admin | Create course |
| `GET` | `/api/v1/courses/{id}/` | Authenticated | Course detail |
| `PATCH` | `/api/v1/courses/{id}/` | Admin | Update course |
| `DELETE` | `/api/v1/courses/{id}/` | Admin | Cancel course (sets `status='cancelled'`) |
| `GET` | `/api/v1/courses/{id}/sessions/` | Authenticated | List sessions |
| `POST` | `/api/v1/courses/{id}/sessions/` | Admin | Add session |
| `PATCH` | `/api/v1/courses/{id}/sessions/{sid}/` | Admin | Update session |
| `DELETE` | `/api/v1/courses/{id}/sessions/{sid}/` | Admin | Delete session |
| `GET` | `/api/v1/courses/{id}/enrollments/` | Admin, Teacher | List enrollments |
| `POST` | `/api/v1/courses/{id}/enrollments/` | Admin | Enroll student |
| `PATCH` | `/api/v1/courses/{id}/enrollments/{eid}/` | Admin | Update payment status |
| `DELETE` | `/api/v1/courses/{id}/enrollments/{eid}/` | Admin | Remove enrollment |

## Signals

**`post_save` on `CourseSession`:**
If the course type is `online` and `scheduled_at` is in the future, a Celery ETA task is scheduled to send the session link 30 minutes before the session. Any previously scheduled task for the same session is revoked first. See `tasks/README.md` for the full flow.

## Filters

| Filter Param | Type | Description |
|---|---|---|
| `type` | choice | `online` / `offline` |
| `status` | choice | `draft` / `active` / `completed` / `cancelled` |
| `level` | string | Case-insensitive contains |
| `teacher` | uuid | Filter by teacher ID |
| `start_date_from` | date | Sessions on or after this date |
| `start_date_to` | date | Sessions on or before this date |
