<!-- ── apps/resources/README.md ────────────────────────────── -->

# Resources App

## Purpose

Manages course materials (PDFs, videos, slides, links) assigned to courses. Access is controlled by role: admin can manage all resources, teachers can upload and view resources for their own courses.

## Models

| Model | Key Fields | Notes |
|---|---|---|
| `CourseResource` | `course`, `title`, `file`, `external_url`, `resource_type`, `uploaded_by` | Either `file` or `external_url` must be set (not both empty). `resource_type`: `pdf`, `video`, `slide`, `link`, `other`. |

## Storage

- **Development**: Files saved to `MEDIA_ROOT/resources/`.
- **Production**: Files uploaded to AWS S3 bucket via `django-storages`. File URLs are resolved via the storage backend automatically.

## API Endpoints

| Method | URL | Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/resources/` | Authenticated (filtered by role) | List resources |
| `POST` | `/api/v1/resources/` | Authenticated | Upload resource |
| `DELETE` | `/api/v1/resources/{id}/` | Admin only | Delete resource |

## Filters

| Filter Param | Type | Description |
|---|---|---|
| `course` | uuid | Filter by course ID |
| `resource_type` | choice | `pdf` / `video` / `slide` / `link` / `other` |

## Business Rules

- Teachers can only upload resources to courses they are assigned to.
- Teachers can view resources for their own courses only.
- Admin can view and manage all resources.
- `uploaded_by` is automatically set to the authenticated user on creation.
