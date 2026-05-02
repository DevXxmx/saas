<!-- ── apps/audit/README.md ────────────────────────────────── -->

# Audit App

## Purpose

Automatically records every create, update, and delete action performed on key models. Provides admin with a full change history for accountability and debugging.

## Models

| Model | Key Fields | Notes |
|---|---|---|
| `AuditLog` | `user`, `action`, `model_affected`, `object_id`, `changes`, `timestamp`, `ip_address` | `action`: `create`, `update`, `delete`. `changes`: JSON diff of field values. |

## How It Works

1. `AuditMiddleware` stores `request.user` and the client IP address in a `threading.local()` on every incoming request.
2. `post_save` and `post_delete` signals are connected to all audited models in `apps/audit/signals.py`.
3. On each signal, an `AuditLog` entry is created using the user from thread-local storage.
4. If the signal fires outside a request context (e.g. from a Celery task), `user` is stored as `null`.

## Audited Models

`CustomUser`, `Teacher`, `Student`, `Course`, `CourseSession`, `Enrollment`, `Attendance`, `Grade`, `Partner`, `CourseResource`.

## API Endpoints

| Method | URL | Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/audit/logs/` | Admin | List audit logs with filters |

## Filters

| Filter Param | Type | Description |
|---|---|---|
| `user` | uuid | Filter by user who made the change |
| `model_affected` | string | Exact model class name (e.g. `Student`) |
| `action` | string | `create` / `update` / `delete` |
| `date_from` | datetime | Logs on or after this timestamp |
| `date_to` | datetime | Logs on or before this timestamp |

## Notes

- `AuditLog` records are never deleted or updated. They are append-only by design.
- `AuditLog` itself is not registered for auditing to prevent infinite recursion.
- The `changes` field stores a dict of field changes:
  ```json
  { "field_name": { "new": "value" } }
  ```
  For `create` actions, only `new` values are recorded. For `delete` actions, `changes` is `null`.
- The admin interface for `AuditLog` is fully read-only (no add, change, or delete permissions).
