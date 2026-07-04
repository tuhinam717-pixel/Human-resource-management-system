import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Spinner, currency, ExportButton } from '../components/ui';
import { FiEdit2 } from '../components/icons';

const PAYROLL_CSV_COLUMNS = [
  { label: 'Name', key: 'name' },
  { label: 'Employee ID', key: 'employee_code' },
  { label: 'Department', key: 'department' },
  { label: 'Job Title', key: 'job_title' },
  { label: 'Basic', key: 'basic' },
  { label: 'HRA', key: 'hra' },
  { label: 'Allowances', key: 'allowances' },
  { label: 'Deductions', key: 'deductions' },
  { label: 'Gross', key: 'gross' },
  { label: 'Net', key: 'net' },
];

export default function Payroll() {
  const { user } = useAuth();
  return user.role === 'hr' ? <HRPayroll /> : <EmployeePayroll user={user} />;
}

/* -------- Employee: read-only payslip -------- */
function EmployeePayroll({ user }) {
  const [pay, setPay] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/payroll/${user.id}`).then((r) => { setPay(r.data.payroll); setLoading(false); });
  }, []);

  if (loading) return <Spinner />;
  if (!pay) return <p className="text-slate-500">No payroll record found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Payroll</h1>
          <p className="text-slate-500">Your salary breakdown (read-only).</p>
        </div>
        <ExportButton columns={PAYROLL_CSV_COLUMNS} rows={pay ? [pay] : []} filename="my_payslip" label="Export payslip" />
      </div>

      <div className="mx-auto max-w-2xl card">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="font-bold text-slate-800">{pay.name}</p>
            <p className="text-sm text-slate-400">{pay.job_title || '—'} · {pay.department || '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Employee ID</p>
            <p className="font-semibold text-slate-700">{pay.employee_code}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-emerald-600">Earnings</p>
            <LineItem label="Basic" value={pay.basic} />
            <LineItem label="HRA" value={pay.hra} />
            <LineItem label="Allowances" value={pay.allowances} />
            <LineItem label="Gross" value={pay.gross} bold />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-rose-600">Deductions</p>
            <LineItem label="Deductions" value={pay.deductions} />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl bg-brand-600 px-5 py-4 text-white">
          <span className="font-semibold">Net pay (monthly)</span>
          <span className="text-2xl font-bold">{currency(pay.net)}</span>
        </div>
      </div>
    </div>
  );
}

function LineItem({ label, value, bold }) {
  return (
    <div className={`flex justify-between border-b border-slate-100 py-2 text-sm ${bold ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
      <span>{label}</span>
      <span>{currency(value)}</span>
    </div>
  );
}

/* -------- HR: manage all payroll -------- */
function HRPayroll() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await api.get('/payroll');
    setList(data.payroll);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openEdit(row) {
    setEditing(row);
    setForm({ basic: row.basic, hra: row.hra, allowances: row.allowances, deductions: row.deductions });
  }

  async function save() {
    setBusy(true);
    try {
      await api.put(`/payroll/${editing.user_id}`, {
        basic: Number(form.basic), hra: Number(form.hra),
        allowances: Number(form.allowances), deductions: Number(form.deductions),
      });
      setEditing(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payroll Management</h1>
          <p className="text-slate-500">View and update salary structures.</p>
        </div>
        <ExportButton columns={PAYROLL_CSV_COLUMNS} rows={list} filename="payroll" label="Export payroll" />
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-slate-400">
              <th className="px-5 py-3 font-medium">Employee</th>
              <th className="px-5 py-3 font-medium">Basic</th>
              <th className="px-5 py-3 font-medium">HRA</th>
              <th className="px-5 py-3 font-medium">Allow.</th>
              <th className="px-5 py-3 font-medium">Deduct.</th>
              <th className="px-5 py-3 font-medium">Net</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((r) => (
              <tr key={r.user_id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-700">{r.name}</p>
                  <p className="text-xs text-slate-400">{r.employee_code} · {r.department || '—'}</p>
                </td>
                <td className="px-5 py-3 text-slate-600">{currency(r.basic)}</td>
                <td className="px-5 py-3 text-slate-600">{currency(r.hra)}</td>
                <td className="px-5 py-3 text-slate-600">{currency(r.allowances)}</td>
                <td className="px-5 py-3 text-slate-600">{currency(r.deductions)}</td>
                <td className="px-5 py-3 font-semibold text-brand-700">{currency(r.net)}</td>
                <td className="px-5 py-3 text-right">
                  <button className="btn-ghost" onClick={() => openEdit(r)}><FiEdit2 size={14} /> Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800">Edit salary · {editing.name}</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {['basic', 'hra', 'allowances', 'deductions'].map((f) => (
                <div key={f}>
                  <label className="label capitalize">{f}</label>
                  <input type="number" className="input" value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-600">
              Net pay: <span className="font-bold text-brand-700">
                {currency(Number(form.basic) + Number(form.hra) + Number(form.allowances) - Number(form.deductions))}
              </span>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
