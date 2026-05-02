<!-- ── apps/accounts/README.md ─────────────────────────────── -->

# Accounts App

## Purpose

Manages platform users: Admin, HR, and Teacher. Provides JWT authentication and role-based access control. Students do not have platform accounts — they are external records managed by the `students` app.

## Models

| Model | Key Fields | Notes |
|---|---|---|
| `CustomUser` | `email`, `role`, `first_name`, `last_name`, `is_active` | `AUTH_USER_MODEL`. Email is the username field. UUID primary key. |
| `Teacher` | `specialization`, `contract_type`, `can_teach_online` | OneToOne → `CustomUser`. Only for users with `role='teacher'`. |
| `Staff` | `department`, `position` | OneToOne → `CustomUser`. Used by HR role users. |

## Roles

| Role Value | Label | Access Level |
|---|---|---|
| `admin` | Administrator | Full access to everything |
| `hr` | Human Resources | Staff/teacher management + notifications |
| `teacher` | Teacher | Own courses, attendance, resources, grades |

## API Endpoints

| Method | URL | Permission | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/login/` | Public | Obtain JWT pair (access + refresh) |
| `POST` | `/api/v1/auth/refresh/` | Public | Refresh access token |
| `POST` | `/api/v1/auth/logout/` | Authenticated | Blacklist refresh token |
| `GET` | `/api/v1/auth/me/` | Authenticated | Current user profile |
| `PATCH` | `/api/v1/auth/me/` | Authenticated | Update own profile |
| `POST` | `/api/v1/auth/change-password/` | Authenticated | Change own password |
| `GET` | `/api/v1/users/` | Admin | List all users |
| `POST` | `/api/v1/users/` | Admin | Create user |
| `GET` | `/api/v1/users/{id}/` | Admin | User detail |
| `PATCH` | `/api/v1/users/{id}/` | Admin | Update user |
| `DELETE` | `/api/v1/users/{id}/` | Admin | Deactivate user (soft delete) |
| `GET` | `/api/v1/teachers/` | Admin, HR | List teachers |
| `GET` | `/api/v1/teachers/{id}/` | Admin, HR | Teacher detail |
| `GET` | `/api/v1/teachers/{id}/schedule/` | Admin, HR | Upcoming sessions for teacher |

## Serializers

- **`UserListSerializer`** — Lightweight user representation for list views.
- **`UserDetailSerializer`** — Full user fields including role and profile links.
- **`UserCreateSerializer`** — Handles user creation with password hashing.
- **`TeacherSerializer`** — Teacher profile with nested user info.
- **`LoginSerializer`** — Accepts `email` + `password`, returns JWT pair.
- **`ChangePasswordSerializer`** — Validates old password, sets new password.

## Permissions Used

- `IsAdmin` — Only users with `role='admin'`.
- `IsAdminOrHR` — Users with `role='admin'` or `role='hr'`.

Both defined in `utils/permissions.py`.

## Notes

- Deleting a user sets `is_active=False` (soft delete). Hard delete is blocked to preserve audit and grade history.
- Teachers are created as `CustomUser(role='teacher')` first, then a `Teacher` profile is auto-created via `post_save` signal.
- `can_teach_online=False` by default. Admin must explicitly enable it before assigning the teacher to online courses.
