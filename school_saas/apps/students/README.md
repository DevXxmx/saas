<!-- ── apps/students/README.md ─────────────────────────────── -->

# Students App

## Purpose

Manages student profiles. Students do not log in to the platform. All communication with students happens via automated or manual emails sent through the communications app.

## Models

| Model | Key Fields | Notes |
|---|---|---|
| `Student` | `first_name`, `last_name`, `email`, `date_of_birth`, `national_id`, `year_enrolled`, `status` | Status choices: `active`, `suspended`, `graduated`, `dropped`. UUID primary key. |

## API Endpoints

| Method | URL | Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/students/` | Admin, HR | List students with filters |
| `POST` | `/api/v1/students/` | Admin | Create student |
| `GET` | `/api/v1/students/{id}/` | Admin, HR | Student detail |
| `PATCH` | `/api/v1/students/{id}/` | Admin | Update student |
| `DELETE` | `/api/v1/students/{id}/` | Admin | Set `status='dropped'` (soft delete) |
| `GET` | `/api/v1/students/{id}/transcript/` | Admin, HR | Grades grouped by module |

## Filters

| Filter Param | Type | Description |
|---|---|---|
| `status` | choice | `active` / `suspended` / `graduated` / `dropped` |
| `year_enrolled` | integer | Exact match on enrollment year |
| `course` | uuid | Students enrolled in this course |
| `search` | string | Searches `first_name`, `last_name`, `email` |

## Business Rules

- `email` and `national_id` must be unique across all students.
- Deleting a student is a soft delete: `status` is set to `'dropped'`, and the record is preserved for grade and attendance history.
- A student can be enrolled in multiple courses simultaneously.
