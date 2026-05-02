# School Management SaaS — Frontend

## Overview

A modern, responsive React dashboard for managing a school platform. Built with Vite + React 19, it provides role-aware interfaces for admins, HR, and teachers to manage students, courses, sessions, attendance, grades, communications, and more. The UI uses TailwindCSS for styling, TanStack Query for server-state caching, Zustand for client-side auth state, and React Router v6 for navigation.

## Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Vite 8 | Dev server and build tool |
| TailwindCSS 3 | Utility-first CSS framework |
| React Router 6 | Client-side routing |
| TanStack Query 5 | Server-state management and caching |
| TanStack Table 8 | Headless data tables with sorting/filtering |
| Zustand 5 | Lightweight auth/state management |
| Axios | HTTP client with JWT interceptors |
| React Hook Form + Zod | Form handling and validation |
| Recharts 3 | Dashboard charts and data visualization |
| Lucide React | Icon library |
| React Hot Toast | Toast notifications |
| Headless UI | Accessible modal/dialog components |
| date-fns | Date formatting and manipulation |

## Project Structure

```
school-saas-frontend/
├── public/                      # Static assets
├── src/
│   ├── api/                     # API service layer
│   │   ├── axios.js             # Axios instance with JWT interceptor
│   │   ├── auth.js              # Login, logout, refresh endpoints
│   │   ├── students.js          # Student CRUD
│   │   ├── courses.js           # Courses, sessions, enrollments
│   │   ├── attendance.js        # Attendance records
│   │   ├── grades.js            # Exams and grades
│   │   ├── communications.js    # Email logs and notifications
│   │   ├── resources.js         # Course resources/materials
│   │   ├── partners.js          # External partners
│   │   └── audit.js             # Audit logs
│   ├── components/              # Reusable UI components
│   │   ├── layout/              # Sidebar, Header, AppLayout
│   │   ├── ui/                  # Buttons, Inputs, Modals, Cards
│   │   └── common/              # DataTable, StatusBadge, SearchBar
│   ├── hooks/                   # Custom React Query hooks
│   │   ├── useStudents.js       # Student queries and mutations
│   │   ├── useCourses.js        # Course queries and mutations
│   │   ├── useAttendance.js     # Attendance queries
│   │   ├── useGrades.js         # Grade/exam queries
│   │   └── ...                  # One hook file per domain
│   ├── pages/                   # Page-level components (routes)
│   │   ├── auth/                # LoginPage
│   │   ├── dashboard/           # DashboardPage (role-aware)
│   │   ├── students/            # StudentList, StudentDetail, StudentForm
│   │   ├── courses/             # CourseList, CourseDetail, CourseForm
│   │   ├── teachers/            # TeacherList, TeacherDetail, TeacherForm
│   │   ├── attendance/          # AttendancePage
│   │   ├── grades/              # GradesPage
│   │   ├── communications/      # EmailLogs, Notifications
│   │   ├── resources/           # ResourcesPage
│   │   ├── partners/            # PartnersPage
│   │   ├── audit/               # AuditLogPage
│   │   └── errors/              # NotFoundPage
│   ├── router/                  # React Router config and guards
│   ├── store/                   # Zustand auth store
│   ├── utils/                   # Validators, constants, helpers
│   ├── App.jsx                  # Root app with QueryClientProvider
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles and Tailwind imports
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── eslint.config.js
```

## Quick Start

### Prerequisites

- **Node.js** 18+ and **npm** 9+
- Backend API running on `http://localhost:8000` (see backend README)

### Installation

1. **Navigate to the frontend directory**
   ```bash
   cd school-saas-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment** (optional)

   Create a `.env` file in the frontend root if the backend runs on a different URL:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
   > The default is `http://localhost:8000` if not set.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**

   Visit `http://localhost:5173` in your browser.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Create production build in `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint on all source files |

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000` |

## Role-Based UI

The dashboard and navigation automatically adapt based on the logged-in user's role:

| Role | Dashboard View | Accessible Modules |
|---|---|---|
| **Admin** | KPI cards, enrollment trends, recent activity | All modules |
| **HR** | Staff and teacher management overview | Students, Teachers, Staff, Communications |
| **Teacher** | My Courses, My Students, Upcoming Sessions | Own courses, attendance, grades, resources |

## Authentication

- Login via email/password on the `/login` page
- JWT access token stored in memory (Zustand store)
- Refresh token used to silently renew expired access tokens via Axios interceptor
- Protected routes redirect to `/login` if not authenticated

## Key Patterns

- **API Layer**: Each domain has a dedicated file in `src/api/` that exports functions returning Axios promises
- **React Query Hooks**: Each domain has a hook file in `src/hooks/` wrapping `useQuery` / `useMutation` with proper cache keys
- **Form Validation**: Zod schemas validate all user input, integrated via `@hookform/resolvers`
- **Data Tables**: TanStack Table provides sorting, filtering, and pagination on all list views
