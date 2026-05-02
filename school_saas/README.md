<!-- ── README.md ──────────────────────────────────────────── -->

# School Management SaaS — Backend

## Overview

A production-ready, multi-role backend for managing schools. Built with Django 4.2+ and Django REST Framework, the platform enables administrators, HR staff, and teachers to manage students, courses, attendance, grades, and communications through a secure REST API. The system automates session link delivery, absence tracking, and payment reminders via Celery background tasks, and logs every data change through a built-in audit trail.

## Tech Stack

| Technology | Purpose |
|---|---|
| Django 4.2+ | Web framework and ORM |
| Django REST Framework | REST API layer |
| PostgreSQL | Primary relational database |
| Redis | Celery broker and result backend |
| Celery | Asynchronous task processing |
| Celery Beat | Periodic task scheduling |
| SimpleJWT | JWT access and refresh token authentication |
| django-filter | Declarative queryset filtering |
| drf-spectacular | OpenAPI 3.0 schema and Swagger/ReDoc docs |
| Mailjet | Transactional email delivery |
| AWS S3 | Production file storage (media uploads) |
| django-storages | S3 storage backend integration |
| python-decouple | Environment variable management |

## Project Structure

```
school_saas/
├── config/                     # Project configuration
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py             # Shared settings (DRF, JWT, Celery, DB)
│   │   ├── development.py      # Debug mode, debug toolbar
│   │   └── production.py       # Security hardening, S3, gunicorn
│   ├── celery.py               # Celery app initialization
│   ├── urls.py                 # Root URL routing (/api/v1/)
│   └── wsgi.py                 # WSGI entry point
├── apps/
│   ├── accounts/               # Users, teachers, staff, JWT auth
│   ├── students/               # Student profiles and transcripts
│   ├── courses/                # Courses, sessions, enrollments
│   ├── attendance/             # Attendance tracking and absence signals
│   ├── grades/                 # Exam grades with auto letter computation
│   ├── communications/         # Email logs, bulk email, notifications
│   ├── resources/              # Course materials (files and links)
│   ├── partners/               # External partner CRM
│   └── audit/                  # Automated audit trail with middleware
├── tasks/
│   ├── email_tasks.py          # Celery tasks for all email operations
│   ├── scheduling_tasks.py     # Scheduled task cleanup
│   └── beat_schedule.py        # Celery Beat periodic definitions
├── utils/
│   ├── email.py                # Mailjet API wrapper
│   ├── pagination.py           # Standard pagination class
│   ├── permissions.py          # Role-based permission classes
│   └── filters.py              # Shared filter re-exports
├── templates/
│   └── emails/                 # HTML email templates (inline CSS)
├── tests/
│   ├── conftest.py             # Pytest fixtures
│   ├── factories.py            # Factory Boy model factories
│   └── test_*.py               # Test modules
├── requirements/
│   ├── base.txt                # Core dependencies
│   ├── development.txt         # Dev and testing dependencies
│   └── production.txt          # Production dependencies
├── manage.py
├── pytest.ini
└── .env.example                # Environment variable template
```

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd school_saas
   ```

2. **Create and activate a virtual environment**
   ```bash
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # Linux/Mac
   source .venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements/development.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

5. **Create the PostgreSQL database**
   ```bash
   createdb school_saas
   ```

6. **Run migrations**
   ```bash
   python manage.py makemigrations accounts students courses attendance grades communications resources partners audit
   python manage.py migrate
   ```

7. **Create a superuser**
   ```bash
   python manage.py createsuperuser
   ```

8. **Start the development server**
   ```bash
   python manage.py runserver
   ```

9. **Start Celery worker** (separate terminal)
   ```bash
   celery -A config.celery worker -l info
   ```

10. **Start Celery Beat** (separate terminal)
    ```bash
    celery -A config.celery beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
    ```

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DJANGO_SECRET_KEY` | Django cryptographic signing key | `s%f8j*8(hf#d7vbg=5a2^!3q` |
| `DJANGO_DEBUG` | Enable debug mode | `True` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated allowed hosts | `localhost,127.0.0.1` |
| `DB_NAME` | PostgreSQL database name | `school_saas` |
| `DB_USER` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `your-password` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `MAILJET_API_KEY` | Mailjet API key for emails | `abc123...` |
| `MAILJET_API_SECRET` | Mailjet API secret for emails | `def456...` |
| `DEFAULT_FROM_EMAIL` | Sender address for outbound emails | `noreply@school.com` |
| `SCHOOL_NAME` | School name used in emails | `My School` |
| `SCHOOL_ADDRESS` | School address for email footers | `123 Education Street` |
| `SCHOOL_PHONE` | School phone for email footers | `+213-555-0100` |
| `SCHOOL_EMAIL` | School contact email | `contact@school.com` |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origins | `http://localhost:3000` |
| `AWS_ACCESS_KEY_ID` | AWS access key (production) | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key (production) | `wJalr...` |
| `AWS_STORAGE_BUCKET_NAME` | S3 bucket name (production) | `school-media` |
| `AWS_S3_REGION_NAME` | S3 region (production) | `eu-west-1` |

## Running Tests

```bash
# Run all tests
pytest

# Run tests for a single app
pytest tests/test_auth.py

# Run with coverage report
pytest --cov=apps --cov-report=term-missing
```

## API Documentation

The API schema is auto-generated by drf-spectacular from the codebase.

| Endpoint | Description |
|---|---|
| `GET /api/schema/` | Download OpenAPI 3.0 YAML schema |
| `GET /api/docs/` | Interactive Swagger UI |
| `GET /api/redoc/` | ReDoc documentation |

> All API endpoints require a `Bearer` token in the `Authorization` header, except `POST /api/v1/auth/login/` and `POST /api/v1/auth/refresh/`.

## Authentication Flow

1. `POST /api/v1/auth/login/` with `email` and `password` to obtain a JWT pair.
2. Receive an `access` token (valid 8 hours) and a `refresh` token (valid 7 days).
3. Include the access token on every request: `Authorization: Bearer {access_token}`.
4. When the access token expires, call `POST /api/v1/auth/refresh/` with the refresh token.
5. On logout, call `POST /api/v1/auth/logout/` to blacklist the refresh token.

## Role Summary

| Role | Capabilities |
|---|---|
| `admin` | Full access to all resources, user management, bulk email, audit logs, and system configuration. |
| `hr` | Manage staff and teacher profiles, view students and notifications, read-only access to courses. |
| `teacher` | Manage attendance, grades, and resources for their own assigned courses only. |

## Automated Tasks

| Task | Trigger | Description |
|---|---|---|
| `send_session_link_email` | 30 minutes before online session | Sends the virtual meeting link to all paid, active students enrolled in the course. |
| `send_absence_warning_email` | 3 consecutive absences detected | Sends a warning email to the student and creates a notification for admin users. |
| `send_payment_reminder_email` | Daily at 09:00 (Africa/Algiers) | Sends payment reminder emails to all students with overdue enrollment payments. |

## Deployment Notes

- Set `DJANGO_DEBUG=False` and use `config.settings.production` in production.
- Configure `DJANGO_ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` for your domain.
- Run `python manage.py collectstatic` before deploying.
- Use `gunicorn` as the WSGI server: `gunicorn config.wsgi:application --bind 0.0.0.0:8000`.
- Point Nginx as a reverse proxy to gunicorn on port 8000.
- Run Celery worker and beat as separate systemd services.
- Use Redis 7+ in production for stability.
- Configure the S3 bucket with appropriate permissions for media file access.

## Contributing

Use branch naming conventions: `feature/`, `fix/`, `chore/` prefixes (e.g. `feature/student-export`). Follow conventional commit message format (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`). Open a pull request against the `main` branch, ensure all tests pass with `pytest`, and request a code review before merging.
