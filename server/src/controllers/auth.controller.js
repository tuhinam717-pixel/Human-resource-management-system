import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { signToken } from '../utils/jwt.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password rule: min 8 chars, at least one letter and one number.
function validPassword(pw) {
  return typeof pw === 'string' && pw.length >= 8 && /[A-Za-z]/.test(pw) && /\d/.test(pw);
}

function publicUser(u) {
  return {
    id: u.id,
    employee_code: u.employee_code,
    name: u.name,
    email: u.email,
    role: u.role,
  };
}

export async function signup(req, res, next) {
  try {
    const { employee_code, name, email, password, role } = req.body;

    if (!employee_code || !name || !email || !password) {
      return res.status(400).json({ message: 'employee_code, name, email and password are required' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (!validPassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and include a letter and a number' });
    }
    const finalRole = role === 'hr' ? 'hr' : 'employee';

    const exists = await query(
      'SELECT 1 FROM users WHERE email = $1 OR employee_code = $2',
      [email.toLowerCase(), employee_code]
    );
    if (exists.rowCount > 0) {
      return res.status(409).json({ message: 'Email or Employee ID already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (employee_code, name, email, password_hash, role)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, employee_code, name, email, role`,
      [employee_code, name, email.toLowerCase(), hash, finalRole]
    );
    const user = rows[0];

    // Give every new user a zeroed salary row so payroll views never break.
    await query('INSERT INTO salaries (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [user.id]);

    const token = signToken({ id: user.id, role: user.role });
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function signin(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id, role: user.role });
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

// Returns the currently authenticated user's full profile.
export async function me(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT id, employee_code, name, email, role, phone, address, profile_pic,
              job_title, department, date_of_joining, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
}
