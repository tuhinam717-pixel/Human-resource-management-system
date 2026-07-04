import { query } from '../config/db.js';

const PROFILE_COLS = `id, employee_code, name, email, role, phone, address, profile_pic,
                      job_title, department, date_of_joining, created_at`;

// GET /api/employees  (HR only) - list all employees.
export async function listEmployees(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT ${PROFILE_COLS} FROM users ORDER BY role DESC, name ASC`
    );
    res.json({ employees: rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/employees/:id  - profile + salary. Employees may only view themselves.
export async function getEmployee(req, res, next) {
  try {
    const targetId = Number(req.params.id);
    if (req.user.role !== 'hr' && req.user.id !== targetId) {
      return res.status(403).json({ message: 'You can only view your own profile' });
    }

    const { rows } = await query(`SELECT ${PROFILE_COLS} FROM users WHERE id = $1`, [targetId]);
    if (!rows[0]) return res.status(404).json({ message: 'Employee not found' });

    const salaryRes = await query('SELECT * FROM salaries WHERE user_id = $1', [targetId]);
    res.json({ employee: rows[0], salary: salaryRes.rows[0] || null });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/employees/:id
// Employees can edit phone/address/profile_pic on their own record.
// HR can edit all fields on anyone.
export async function updateEmployee(req, res, next) {
  try {
    const targetId = Number(req.params.id);
    const isHR = req.user.role === 'hr';
    const isSelf = req.user.id === targetId;

    if (!isHR && !isSelf) {
      return res.status(403).json({ message: 'Not allowed to edit this profile' });
    }

    const employeeEditable = ['phone', 'address', 'profile_pic'];
    const hrEditable = [...employeeEditable, 'name', 'email', 'job_title', 'department', 'date_of_joining', 'role'];
    const allowed = isHR ? hrEditable : employeeEditable;

    const updates = [];
    const values = [];
    let i = 1;
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${i++}`);
        values.push(req.body[field]);
      }
    }
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No editable fields provided' });
    }
    values.push(targetId);

    const { rows } = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${i} RETURNING ${PROFILE_COLS}`,
      values
    );
    if (!rows[0]) return res.status(404).json({ message: 'Employee not found' });
    res.json({ employee: rows[0] });
  } catch (err) {
    next(err);
  }
}
