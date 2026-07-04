import { query } from '../config/db.js';

// GET /api/payroll/:userId  - salary for a user. Employees only their own.
export async function getPayroll(req, res, next) {
  try {
    const targetId = Number(req.params.userId);
    if (req.user.role !== 'hr' && req.user.id !== targetId) {
      return res.status(403).json({ message: 'You can only view your own payroll' });
    }

    const { rows } = await query(
      `SELECT s.*, u.name, u.employee_code, u.job_title, u.department
       FROM salaries s JOIN users u ON u.id = s.user_id
       WHERE s.user_id = $1`,
      [targetId]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Payroll record not found' });

    const s = rows[0];
    const gross = Number(s.basic) + Number(s.hra) + Number(s.allowances);
    const net = gross - Number(s.deductions);
    res.json({ payroll: { ...s, gross, net } });
  } catch (err) {
    next(err);
  }
}

// GET /api/payroll  (HR only) - all payroll records.
export async function listPayroll(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT s.*, u.name, u.employee_code, u.job_title, u.department
       FROM salaries s JOIN users u ON u.id = s.user_id
       ORDER BY u.name ASC`
    );
    const payroll = rows.map((s) => {
      const gross = Number(s.basic) + Number(s.hra) + Number(s.allowances);
      return { ...s, gross, net: gross - Number(s.deductions) };
    });
    res.json({ payroll });
  } catch (err) {
    next(err);
  }
}

// PUT /api/payroll/:userId  (HR only) - update salary structure.
export async function updatePayroll(req, res, next) {
  try {
    const targetId = Number(req.params.userId);
    const { basic, hra, allowances, deductions, effective_from } = req.body;

    const { rows } = await query(
      `INSERT INTO salaries (user_id, basic, hra, allowances, deductions, effective_from, updated_at)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE), now())
       ON CONFLICT (user_id) DO UPDATE SET
         basic = EXCLUDED.basic,
         hra = EXCLUDED.hra,
         allowances = EXCLUDED.allowances,
         deductions = EXCLUDED.deductions,
         effective_from = EXCLUDED.effective_from,
         updated_at = now()
       RETURNING *`,
      [targetId, basic || 0, hra || 0, allowances || 0, deductions || 0, effective_from || null]
    );
    res.json({ payroll: rows[0] });
  } catch (err) {
    next(err);
  }
}
