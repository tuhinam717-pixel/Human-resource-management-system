import { query } from '../config/db.js';

// POST /api/attendance/check-in  - marks/updates today's row for the logged-in user.
export async function checkIn(req, res, next) {
  try {
    const { rows } = await query(
      `INSERT INTO attendance (user_id, work_date, check_in, status)
       VALUES ($1, CURRENT_DATE, now(), 'present')
       ON CONFLICT (user_id, work_date)
       DO UPDATE SET check_in = COALESCE(attendance.check_in, EXCLUDED.check_in),
                     status = CASE WHEN attendance.status = 'absent' THEN 'present' ELSE attendance.status END
       RETURNING *`,
      [req.user.id]
    );
    res.json({ attendance: rows[0] });
  } catch (err) {
    next(err);
  }
}

// POST /api/attendance/check-out
export async function checkOut(req, res, next) {
  try {
    const { rows } = await query(
      `UPDATE attendance SET check_out = now()
       WHERE user_id = $1 AND work_date = CURRENT_DATE
       RETURNING *`,
      [req.user.id]
    );
    if (!rows[0]) {
      return res.status(400).json({ message: 'You have not checked in today' });
    }
    res.json({ attendance: rows[0] });
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance?userId=&from=&to=
// Employees can only read their own; HR can pass any userId (or omit for all).
export async function listAttendance(req, res, next) {
  try {
    const isHR = req.user.role === 'hr';
    const requestedUser = req.query.userId ? Number(req.query.userId) : null;

    if (!isHR && requestedUser && requestedUser !== req.user.id) {
      return res.status(403).json({ message: 'You can only view your own attendance' });
    }
    const targetUser = isHR ? requestedUser : req.user.id;

    const conditions = [];
    const params = [];
    let i = 1;
    if (targetUser) {
      conditions.push(`a.user_id = $${i++}`);
      params.push(targetUser);
    }
    if (req.query.from) {
      conditions.push(`a.work_date >= $${i++}`);
      params.push(req.query.from);
    }
    if (req.query.to) {
      conditions.push(`a.work_date <= $${i++}`);
      params.push(req.query.to);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT a.*, u.name, u.employee_code
       FROM attendance a JOIN users u ON u.id = a.user_id
       ${where}
       ORDER BY a.work_date DESC, u.name ASC`,
      params
    );
    res.json({ attendance: rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/today  - convenience for the logged-in user's dashboard.
export async function todayStatus(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT * FROM attendance WHERE user_id = $1 AND work_date = CURRENT_DATE`,
      [req.user.id]
    );
    res.json({ attendance: rows[0] || null });
  } catch (err) {
    next(err);
  }
}
