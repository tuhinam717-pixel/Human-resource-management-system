import { query } from '../config/db.js';

const VALID_TYPES = ['paid', 'sick', 'unpaid'];

// POST /api/leaves  - employee applies for leave.
export async function applyLeave(req, res, next) {
  try {
    const { leave_type, start_date, end_date, remarks } = req.body;
    if (!leave_type || !start_date || !end_date) {
      return res.status(400).json({ message: 'leave_type, start_date and end_date are required' });
    }
    if (!VALID_TYPES.includes(leave_type)) {
      return res.status(400).json({ message: 'Invalid leave type' });
    }
    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ message: 'End date cannot be before start date' });
    }

    const { rows } = await query(
      `INSERT INTO leaves (user_id, leave_type, start_date, end_date, remarks)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, leave_type, start_date, end_date, remarks || null]
    );
    res.status(201).json({ leave: rows[0] });
  } catch (err) {
    next(err);
  }
}

// GET /api/leaves
// Employee -> own requests. HR -> all requests (optionally ?status=pending).
export async function listLeaves(req, res, next) {
  try {
    const isHR = req.user.role === 'hr';
    const conditions = [];
    const params = [];
    let i = 1;

    if (!isHR) {
      conditions.push(`l.user_id = $${i++}`);
      params.push(req.user.id);
    }
    if (req.query.status) {
      conditions.push(`l.status = $${i++}`);
      params.push(req.query.status);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT l.*, u.name, u.employee_code, u.department
       FROM leaves l JOIN users u ON u.id = l.user_id
       ${where}
       ORDER BY
         CASE l.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
         l.created_at DESC`,
      params
    );
    res.json({ leaves: rows });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/leaves/:id/decision  (HR only) - approve/reject with a comment.
export async function decideLeave(req, res, next) {
  try {
    const { status, admin_comment } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'status must be "approved" or "rejected"' });
    }

    const { rows } = await query(
      `UPDATE leaves
       SET status = $1, admin_comment = $2, reviewed_by = $3
       WHERE id = $4 AND status = 'pending'
       RETURNING *`,
      [status, admin_comment || null, req.user.id, Number(req.params.id)]
    );
    if (!rows[0]) {
      return res.status(404).json({ message: 'Pending leave request not found' });
    }
    const leave = rows[0];

    // If approved, mark those days as "leave" in attendance so records stay in sync.
    if (status === 'approved') {
      await query(
        `INSERT INTO attendance (user_id, work_date, status)
         SELECT $1, d::date, 'leave'
         FROM generate_series($2::date, $3::date, interval '1 day') d
         ON CONFLICT (user_id, work_date)
         DO UPDATE SET status = 'leave'`,
        [leave.user_id, leave.start_date, leave.end_date]
      );
    }

    res.json({ leave });
  } catch (err) {
    next(err);
  }
}
