# HRMS — Human Resource Management System

> _Every workday, perfectly aligned._

A full-stack HRMS built for the Odoo hackathon. Secure auth with role-based access
(HR/Admin vs Employee), employee profiles, attendance with a monthly calendar &
check-in/out, leave management with approval workflows, and payroll.

## Tech Stack

| Layer     | Tech                                        |
| --------- | ------------------------------------------- |
| Frontend  | React 18 + Vite + Tailwind CSS + React Router |
| Backend   | Node.js + Express (ES modules)              |
| Database  | PostgreSQL (`pg`)                           |
| Auth      | JWT + bcrypt                                |

## Folder Structure

```
Human-resource-management-system/
├── server/                     # Express + PostgreSQL API
│   ├── index.js                # Server entry (DB check + listen)
│   └── src/
│       ├── app.js              # Express app + route mounting
│       ├── config/db.js        # PG connection pool
│       ├── db/
│       │   ├── schema.sql       # Tables
│       │   ├── migrate.js       # Runs schema.sql
│       │   └── seed.js          # Demo data
│       ├── middleware/auth.js   # JWT verify + hrOnly guard
│       ├── utils/jwt.js
│       ├── controllers/         # auth, employee, attendance, leave, payroll
│       └── routes/              # one router per resource
│
├── client/                     # React + Vite frontend
│   ├── index.html
│   ├── vite.config.js          # /api proxy -> localhost:5000
│   └── src/
│       ├── main.jsx / App.jsx   # Routing
│       ├── api/client.js        # Axios instance (JWT interceptor)
│       ├── context/AuthContext.jsx
│       ├── components/          # Layout, ProtectedRoute, ui helpers
│       └── pages/               # Login, Signup, Dashboard, Profile,
│                                #   Attendance, Leaves, Payroll, Employees
└── README.md
```

## Setup

### 1. Database
PostgreSQL must be running. Create the database and configure `server/.env`
(copy from `.env.example`) with your Postgres credentials:

```bash
createdb hrms          # or via pgAdmin / psql: CREATE DATABASE hrms;
```

### 2. Backend
```bash
cd server
npm install
npm run db:reset       # creates tables + seeds demo data
npm run dev            # http://localhost:5000
```

### 3. Frontend
```bash
cd client
npm install
npm run dev            # http://localhost:5173
```

## Demo Logins

| Role      | Email           | Password       |
| --------- | --------------- | -------------- |
| HR/Admin  | hr@hrms.com     | `Password@123` |
| Employee  | rahul@hrms.com  | `Password@123` |

## Features

- **Auth** — Sign up (Employee/HR role), sign in, JWT sessions, password rules.
- **Dashboards** — role-aware; quick-access cards for employees, workforce
  overview + pending approvals for HR.
- **Profile** — view personal/job/salary details; employees edit contact info &
  photo, HR edits everything.
- **Attendance** — check-in/check-out, monthly calendar with Present/Absent/
  Half-day/Leave markers, HR can view any employee.
- **Leave** — apply (paid/sick/unpaid) with date range & remarks; HR approves/
  rejects with comments; approved leave syncs into attendance.
- **Payroll** — read-only payslip for employees; HR views & edits salary structures.

## API Overview

| Method | Endpoint                         | Access   |
| ------ | -------------------------------- | -------- |
| POST   | `/api/auth/signup`               | public   |
| POST   | `/api/auth/signin`               | public   |
| GET    | `/api/auth/me`                   | auth     |
| GET    | `/api/employees`                 | HR       |
| GET    | `/api/employees/:id`             | auth     |
| PATCH  | `/api/employees/:id`             | auth     |
| POST   | `/api/attendance/check-in|out`   | auth     |
| GET    | `/api/attendance`                | auth     |
| POST   | `/api/leaves`                    | auth     |
| GET    | `/api/leaves`                    | auth     |
| PATCH  | `/api/leaves/:id/decision`       | HR       |
| GET    | `/api/payroll` / `/:userId`      | HR / auth|
| PUT    | `/api/payroll/:userId`           | HR       |
