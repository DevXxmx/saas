<!-- ── apps/grades/README.md ───────────────────────────────── -->

# Grades App

## Purpose

Records exam marks per module per enrollment. Automatically computes a letter grade on save. Provides a transcript view grouped by module for each student.

## Models

| Model | Key Fields | Notes |
|---|---|---|
| `Grade` | `enrollment`, `module_name`, `mark`, `grade_letter`, `exam_type`, `graded_at` | `grade_letter` is computed on save, not set by the caller. UUID primary key. |

## Grade Letter Scale

| Mark Range | Letter |
|---|---|
| 90–100 | A+ |
| 85–89 | A |
| 80–84 | B+ |
| 75–79 | B |
| 70–74 | C+ |
| 65–69 | C |
| 50–64 | D |
| 0–49 | F |

## Exam Types

`midterm`, `final`, `quiz`, `project`.

## API Endpoints

| Method | URL | Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/grades/` | Admin, Teacher | List grades with filters |
| `POST` | `/api/v1/grades/` | Admin, Teacher | Create grade |
| `PATCH` | `/api/v1/grades/{id}/` | Admin, Teacher | Update mark/module |
| `DELETE` | `/api/v1/grades/{id}/` | Admin only | Delete grade |
| `GET` | `/api/v1/students/{id}/transcript/` | Admin, HR | Grades grouped by `module_name` |

## Filters

| Filter Param | Type | Description |
|---|---|---|
| `enrollment` | uuid | Filter by enrollment ID |
| `module_name` | string | Case-insensitive contains |
| `exam_type` | choice | `midterm` / `final` / `quiz` / `project` |
| `mark_gte` | number | Minimum mark (inclusive) |
| `mark_lte` | number | Maximum mark (inclusive) |

## Business Rules

- Teachers can only create/update grades for enrollments in their own courses (enforced via queryset filtering).
- `grade_letter` is always recomputed on `save()`; it cannot be set manually via the API.
- A student can have multiple grades per module (e.g. quiz + final).
