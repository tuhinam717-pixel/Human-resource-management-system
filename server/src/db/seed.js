// Seeds rich demo data: HR admins + many employees across departments,
// ~30 days of attendance each, and leaves in every status.
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

const PASSWORD = 'Password@123'; // same demo password for every seeded account

const PEOPLE = [
  // --- HR / Admin ---
  { code: 'HR001', name: 'Aisha Khan',      email: 'hr@hrms.com',        role: 'hr',
    title: 'HR Manager',        dept: 'Human Resources', doj: '2020-01-10', phone: '9876500001',
    address: '12 MG Road, Bengaluru', salary: { basic: 70000, hra: 28000, allow: 12000, ded: 6000 } },
  { code: 'HR002', name: 'Rohan Mehta',     email: 'rohan.hr@hrms.com',  role: 'hr',
    title: 'HR Executive',      dept: 'Human Resources', doj: '2021-06-01', phone: '9876500002',
    address: '5 Park Street, Kolkata', salary: { basic: 55000, hra: 22000, allow: 9000, ded: 4500 } },

  // --- Engineering ---
  { code: 'EMP001', name: 'Rahul Sharma',   email: 'rahul@hrms.com',     role: 'employee',
    title: 'Senior Software Engineer', dept: 'Engineering', doj: '2021-03-15', phone: '9876500003',
    address: '88 Koramangala, Bengaluru', salary: { basic: 65000, hra: 26000, allow: 11000, ded: 5500 } },
  { code: 'EMP002', name: 'Vikram Singh',   email: 'vikram@hrms.com',    role: 'employee',
    title: 'QA Engineer',       dept: 'Engineering', doj: '2022-02-20', phone: '9876500004',
    address: '23 Andheri West, Mumbai', salary: { basic: 48000, hra: 19200, allow: 7500, ded: 3800 } },
  { code: 'EMP003', name: 'Sneha Reddy',    email: 'sneha@hrms.com',     role: 'employee',
    title: 'Backend Developer', dept: 'Engineering', doj: '2022-08-11', phone: '9876500005',
    address: '17 Jubilee Hills, Hyderabad', salary: { basic: 55000, hra: 22000, allow: 9000, ded: 4400 } },
  { code: 'EMP004', name: 'Arjun Nair',     email: 'arjun@hrms.com',     role: 'employee',
    title: 'DevOps Engineer',   dept: 'Engineering', doj: '2023-01-05', phone: '9876500006',
    address: '9 Marine Drive, Kochi', salary: { basic: 58000, hra: 23200, allow: 9500, ded: 4700 } },

  // --- Design ---
  { code: 'EMP005', name: 'Priya Patel',    email: 'priya@hrms.com',     role: 'employee',
    title: 'UI/UX Designer',    dept: 'Design', doj: '2022-07-01', phone: '9876500007',
    address: '45 CG Road, Ahmedabad', salary: { basic: 46000, hra: 18400, allow: 7000, ded: 3600 } },
  { code: 'EMP006', name: 'Kabir Malhotra', email: 'kabir@hrms.com',     role: 'employee',
    title: 'Product Designer',  dept: 'Design', doj: '2023-04-18', phone: '9876500008',
    address: '3 Connaught Place, Delhi', salary: { basic: 50000, hra: 20000, allow: 8000, ded: 4000 } },

  // --- Sales & Marketing ---
  { code: 'EMP007', name: 'Ananya Iyer',    email: 'ananya@hrms.com',    role: 'employee',
    title: 'Sales Executive',   dept: 'Sales', doj: '2021-11-22', phone: '9876500009',
    address: '77 Anna Salai, Chennai', salary: { basic: 42000, hra: 16800, allow: 6500, ded: 3300 } },
  { code: 'EMP008', name: 'Dev Joshi',      email: 'dev@hrms.com',       role: 'employee',
    title: 'Marketing Lead',    dept: 'Marketing', doj: '2020-09-30', phone: '9876500010',
    address: '14 FC Road, Pune', salary: { basic: 60000, hra: 24000, allow: 10000, ded: 5000 } },

  // --- Finance ---
  { code: 'EMP009', name: 'Meera Desai',    email: 'meera@hrms.com',     role: 'employee',
    title: 'Accountant',        dept: 'Finance', doj: '2022-05-16', phone: '9876500011',
    address: '2 Residency Road, Jaipur', salary: { basic: 44000, hra: 17600, allow: 7000, ded: 3500 } },
  { code: 'EMP010', name: 'Karan Gupta',    email: 'karan@hrms.com',     role: 'employee',
    title: 'Finance Analyst',   dept: 'Finance', doj: '2023-07-10', phone: '9876500012',
    address: '61 Salt Lake, Kolkata', salary: { basic: 47000, hra: 18800, allow: 7500, ded: 3700 } },
];

// Deterministic pseudo-random so the seed is stable but varied per person/day.
function pick(seed, options) {
  return options[Math.abs(seed) % options.length];
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE leaves, attendance, salaries, users RESTART IDENTITY CASCADE');

    const hash = await bcrypt.hash(PASSWORD, 10);
    const ids = {};

    for (const p of PEOPLE) {
      const { rows } = await client.query(
        `INSERT INTO users (employee_code, name, email, password_hash, role, phone, address, job_title, department, date_of_joining)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [p.code, p.name, p.email, hash, p.role, p.phone, p.address, p.title, p.dept, p.doj]
      );
      const id = rows[0].id;
      ids[p.code] = id;

      await client.query(
        `INSERT INTO salaries (user_id, basic, hra, allowances, deductions)
         VALUES ($1,$2,$3,$4,$5)`,
        [id, p.salary.basic, p.salary.hra, p.salary.allow, p.salary.ded]
      );
    }

    // ~30 days of attendance for everyone (skip Sundays).
    const STATUS_POOL = ['present', 'present', 'present', 'present', 'half-day', 'present', 'absent'];
    for (const p of PEOPLE) {
      const uid = ids[p.code];
      for (let d = 30; d >= 1; d--) {
        // Determine weekday for (today - d).
        const status = pick(uid * 31 + d, STATUS_POOL);
        const isCheckedDay = status !== 'absent';
        const inHrs = 9;   // ~9am
        const outHrs = status === 'half-day' ? 4 : 1; // half-day leaves early
        await client.query(
          `INSERT INTO attendance (user_id, work_date, status, check_in, check_out)
           SELECT $1, wd, $2,
             CASE WHEN $3 THEN wd + time '09:15' ELSE NULL END,
             CASE WHEN $3 THEN wd + (time '18:00' - ($4 || ' hour')::interval) ELSE NULL END
           FROM (SELECT (CURRENT_DATE - $5::int) AS wd) t
           WHERE EXTRACT(DOW FROM (CURRENT_DATE - $5::int)) <> 0   -- skip Sundays
           ON CONFLICT (user_id, work_date) DO NOTHING`,
          [uid, status, isCheckedDay, String(outHrs), d]
        );
      }
    }

    // Leaves in every status, across several employees.
    const LEAVES = [
      { code: 'EMP001', type: 'sick',   from: 2,  to: 3,   remarks: 'Fever and cold, need rest',        status: 'pending' },
      { code: 'EMP002', type: 'paid',   from: 10, to: 12,  remarks: 'Family wedding',                    status: 'pending' },
      { code: 'EMP003', type: 'unpaid', from: 5,  to: 5,   remarks: 'Personal work',                     status: 'pending' },
      { code: 'EMP005', type: 'paid',   from: 15, to: 18,  remarks: 'Vacation to Goa',                   status: 'approved', by: 'HR001', comment: 'Approved. Enjoy!' },
      { code: 'EMP007', type: 'sick',   from: -6, to: -5,  remarks: 'Medical appointment',               status: 'approved', by: 'HR001', comment: 'Get well soon.' },
      { code: 'EMP008', type: 'unpaid', from: 20, to: 25,  remarks: 'Extended personal leave',           status: 'rejected', by: 'HR002', comment: 'Too long during release week.' },
      { code: 'EMP004', type: 'paid',   from: 8,  to: 9,   remarks: 'Diwali celebrations',               status: 'pending' },
      { code: 'EMP009', type: 'sick',   from: -3, to: -2,  remarks: 'Viral fever',                       status: 'approved', by: 'HR001', comment: 'Approved.' },
    ];

    for (const l of LEAVES) {
      await client.query(
        `INSERT INTO leaves (user_id, leave_type, start_date, end_date, remarks, status, admin_comment, reviewed_by)
         VALUES ($1,$2, CURRENT_DATE + $3::int, CURRENT_DATE + $4::int, $5, $6, $7, $8)`,
        [ids[l.code], l.type, l.from, l.to, l.remarks, l.status, l.comment || null, l.by ? ids[l.by] : null]
      );
      // Reflect approved leaves into attendance.
      if (l.status === 'approved') {
        await client.query(
          `INSERT INTO attendance (user_id, work_date, status)
           SELECT $1, d::date, 'leave'
           FROM generate_series(CURRENT_DATE + $2::int, CURRENT_DATE + $3::int, interval '1 day') d
           ON CONFLICT (user_id, work_date) DO UPDATE SET status = 'leave'`,
          [ids[l.code], l.from, l.to]
        );
      }
    }

    await client.query('COMMIT');
    const counts = await pool.query(
      `SELECT (SELECT count(*) FROM users) u, (SELECT count(*) FROM attendance) a, (SELECT count(*) FROM leaves) l`
    );
    const c = counts.rows[0];
    console.log('✅ Seed complete.');
    console.log(`   ${c.u} users · ${c.a} attendance rows · ${c.l} leave requests`);
    console.log('   HR login:       hr@hrms.com    /', PASSWORD);
    console.log('   Employee login: rahul@hrms.com /', PASSWORD);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
