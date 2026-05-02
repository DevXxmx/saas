# School Management SaaS

A full-stack, multi-role school management platform with a Django REST API backend and a React + Vite frontend. Designed for managing students, courses, sessions, attendance, grades, communications, resources, and partners — with role-based access for admins, HR staff, and teachers.

## Architecture

```
saas/
├── school_saas/              # Django Backend (API)
│   ├── apps/                 # 9 Django apps (accounts, students, courses, ...)
│   ├── config/               # Settings, URLs, Celery, WSGI
│   ├── tasks/                # Celery async tasks (emails, scheduling)
│   ├── utils/                # Shared utilities (email, pagination, permissions)
│   ├── templates/            # HTML email templates
│   ├── tests/                # Pytest test suite
│   └── requirements/         # Pip dependency files
│
├── school-saas-frontend/     # React Frontend (SPA)
│   ├── src/
│   │   ├── api/              # Axios API service layer
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # React Query hooks per domain
│   │   ├── pages/            # Route-level page components
│   │   ├── router/           # React Router config and guards
│   │   ├── store/            # Zustand auth store
│   │   └── utils/            # Validators, constants, helpers
│   └── package.json
│
└── README.md                 # ← You are here
```

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Django 4.2+, Django REST Framework, PostgreSQL, Redis, Celery |
| **Frontend** | React 19, Vite 8, TailwindCSS 3, TanStack Query/Table, Zustand |
| **Auth** | JWT (SimpleJWT) — access + refresh tokens |
| **Email** | Mailjet API v3.1 |
| **Storage** | Local filesystem (dev), AWS S3 (production) |
| **Docs** | drf-spectacular → Swagger UI / ReDoc |

## Prerequisites

Before you begin, make sure the following are installed on your machine:

| Tool | Version | Purpose |
|---|---|---|
| **Python** | 3.10+ | Backend runtime |
| **Node.js** | 18+ | Frontend runtime |
| **npm** | 9+ | Frontend package manager |
| **PostgreSQL** | 14+ | Relational database |
| **Redis** | 7+ | Celery message broker |
| **Git** | 2.30+ | Version control |

## Getting Started After Cloning

### Step 1 — Clone the Repository

```bash
git clone <repository-url>
cd saas
```

---

### Step 2 — Backend Setup

```bash
# Navigate to the backend
cd school_saas

# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Install dependencies
pip install -r requirements/development.txt

# Copy the environment template and edit it
cp .env.example .env
# Edit .env with your PostgreSQL credentials, Mailjet keys, etc.
```

#### Configure the `.env` File

Open `school_saas/.env` and set at minimum:

```env
DJANGO_SECRET_KEY=your-random-secret-key
DJANGO_DEBUG=True
DB_NAME=school_saas
DB_USER=postgres
DB_PASSWORD=your-postgres-password
DB_HOST=localhost
DB_PORT=5432
REDIS_URL=redis://localhost:6379/0
```

> See the full variable list in `school_saas/README.md` or `.env.example`.

#### Create the Database and Run Migrations

```bash
# Create the PostgreSQL database (use psql or pgAdmin)
createdb school_saas

# Run migrations
python manage.py migrate

# Create an admin account
python manage.py createsuperuser

# (Optional) Load sample data
python manage.py seed_data
```

#### Start the Backend

```bash
# Terminal 1 — Django dev server
python manage.py runserver
```

The API is now available at `http://localhost:8000`.

- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
- Admin Panel: `http://localhost:8000/admin/`

---

### Step 3 — Frontend Setup

```bash
# Open a new terminal and navigate to the frontend
cd school-saas-frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend is now available at `http://localhost:5173`.

> The frontend connects to `http://localhost:8000` by default. To change this, create a `.env` file:
> ```env
> VITE_API_URL=http://localhost:8000
> ```

---

### Step 4 — Background Tasks (Optional but Recommended)

To enable automated emails (session links, absence warnings, payment reminders), you need Redis + Celery:

```bash
# Make sure Redis is running
redis-server

# Terminal 3 — Celery Worker (processes async tasks)
cd school_saas
celery -A config.celery worker -l info

# Terminal 4 — Celery Beat (schedules periodic tasks)
celery -A config.celery beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

---

## Running Everything — Summary

You need **2 terminals minimum** (4 for full functionality):

| Terminal | Directory | Command | Purpose |
|---|---|---|---|
| 1 | `school_saas/` | `python manage.py runserver` | Django API server |
| 2 | `school-saas-frontend/` | `npm run dev` | React dev server |
| 3 | `school_saas/` | `celery -A config.celery worker -l info` | Task execution |
| 4 | `school_saas/` | `celery -A config.celery beat -l info` | Periodic scheduling |

## Default URLs

| Service | URL |
|---|---|
| Frontend App | `http://localhost:5173` |
| Backend API | `http://localhost:8000/api/v1/` |
| Swagger Docs | `http://localhost:8000/api/docs/` |
| ReDoc | `http://localhost:8000/api/redoc/` |
| Django Admin | `http://localhost:8000/admin/` |

## User Roles

| Role | Login With | Access Level |
|---|---|---|
| **Admin** | Superuser or `role=admin` account | Full access to all modules |
| **HR** | `role=hr` account | Staff, teachers, students, communications |
| **Teacher** | `role=teacher` account | Own courses, attendance, grades, resources only |

## Automated Email Tasks

| Task | Trigger | Requires |
|---|---|---|
| Session link delivery | 30 min before online session | Celery Worker + Redis |
| Absence warning | 3 consecutive absences | Celery Worker + Redis |
| Payment reminders | Daily at 09:00 | Celery Worker + Beat + Redis |

> Email sending requires valid Mailjet API credentials in the `.env` file.

## Testing

```bash
# Backend tests
cd school_saas
pytest
pytest --cov=apps --cov-report=term-missing

# Frontend lint
cd school-saas-frontend
npm run lint
```

## Production Deployment

Refer to the backend README (`school_saas/README.md`) for detailed production deployment instructions including:

- Gunicorn + Nginx setup
- Static file collection
- S3 media storage configuration
- Security hardening (`DEBUG=False`, `ALLOWED_HOSTS`, HTTPS)
- Celery as systemd services

## License

This project is proprietary. All rights reserved.
