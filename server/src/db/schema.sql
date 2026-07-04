-- HRMS database schema
-- Idempotent: safe to run on every deploy/start — existing data is preserved.
-- (For a full local reset, drop the tables manually or drop the database.)

-- Users = auth + profile + job details in one table (simple for a hackathon).
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  employee_code   VARCHAR(50)  UNIQUE NOT NULL,
  name            VARCHAR(120) NOT NULL,
  email           VARCHAR(160) UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  role            VARCHAR(20)  NOT NULL DEFAULT 'employee'
                    CHECK (role IN ('employee', 'hr')),
  -- Profile (employee editable)
  phone           VARCHAR(30),
  address         TEXT,
  profile_pic     TEXT,
  -- Job details (admin editable)
  job_title       VARCHAR(120),
  department      VARCHAR(120),
  date_of_joining DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Salary structure (one active row per user; admin controlled).
CREATE TABLE IF NOT EXISTS salaries (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  basic          NUMERIC(12,2) NOT NULL DEFAULT 0,
  hra            NUMERIC(12,2) NOT NULL DEFAULT 0,
  allowances     NUMERIC(12,2) NOT NULL DEFAULT 0,
  deductions     NUMERIC(12,2) NOT NULL DEFAULT 0,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Daily attendance. One row per user per day.
CREATE TABLE IF NOT EXISTS attendance (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  work_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in   TIMESTAMPTZ,
  check_out  TIMESTAMPTZ,
  status     VARCHAR(20) NOT NULL DEFAULT 'absent'
               CHECK (status IN ('present', 'absent', 'half-day', 'leave')),
  UNIQUE (user_id, work_date)
);

-- Leave / time-off requests.
CREATE TABLE IF NOT EXISTS leaves (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type    VARCHAR(20) NOT NULL
                  CHECK (leave_type IN ('paid', 'sick', 'unpaid')),
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  remarks       TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_comment TEXT,
  reviewed_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance (user_id, work_date);
CREATE INDEX IF NOT EXISTS idx_leaves_user          ON leaves (user_id);
CREATE INDEX IF NOT EXISTS idx_leaves_status        ON leaves (status);
