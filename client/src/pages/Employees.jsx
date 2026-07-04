import { useEffect, useState } from 'react';
import api from '../api/client';
import { Spinner, currency, ExportButton } from '../components/ui';
import { FiSearch, FiEdit2 } from '../components/icons';

const EMPLOYEE_CSV_COLUMNS = [
  { label: 'Employee ID', key: 'employee_code' },
  { label: 'Name', key: 'name' },
  { label: 'Email', key: 'email' },
  { label: 'Role', value: (e) => (e.role === 'hr' ? 'HR/Admin' : 'Employee') },
  { label: 'Phone', key: 'phone' },
  { label: 'Department', key: 'department' },
  { label: 'Job Title', key: 'job_title' },
  { label: 'Address', key: 'address' },
  { label: 'Date of Joining', value: (e) => (e.date_of_joining ? e.date_of_joining.slice(0, 10) : '') },
];

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  async function loadList() {
    const { data } = await api.get('/employees');
    setEmployees(data.employees);
    if (!selectedId && data.employees.length) setSelectedId(data.employees[0].id);
    setLoading(false);
  }
  useEffect(() => { loadList(); }, []);

  async function loadDetail(id) {
    const { data } = await api.get(`/employees/${id}`);
    setDetail(data);
    setForm({
      name: data.employee.name || '',
      email: data.employee.email || '',
      phone: data.employee.phone || '',
      address: data.employee.address || '',
      job_title: data.employee.job_title || '',
      department: data.employee.department || '',
      date_of_joining: data.employee.date_of_joining ? data.employee.date_of_joining.slice(0, 10) : '',
      role: data.employee.role,
    });
    setEditing(false);
  }
  useEffect(() => { if (selectedId) loadDetail(selectedId); }, [selectedId]);

  async function save() {
    setSaving(true);
    try {
      await api.patch(`/employees/${selectedId}`, form);
      await Promise.all([loadDetail(selectedId), loadList()]);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  const filtered = employees.filter((e) =>
    `${e.name} ${e.employee_code} ${e.department || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Employees</h1>
          <p className="text-slate-500">Manage employee records and job details.</p>
        </div>
        <ExportButton columns={EMPLOYEE_CSV_COLUMNS} rows={employees} filename="employees" label="Export employees" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* List */}
        <div className="card p-0">
          <div className="border-b border-slate-100 p-3">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input className="input pl-9" placeholder="Search employees…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="max-h-[70vh] divide-y divide-slate-100 overflow-y-auto">
            {filtered.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedId(e.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${selectedId === e.id ? 'bg-brand-50' : 'hover:bg-slate-50'}`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {e.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{e.name}</p>
                  <p className="text-xs text-slate-400">{e.employee_code} · {e.department || '—'}</p>
                </div>
                {e.role === 'hr' && <span className="badge bg-brand-100 text-brand-700">HR</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {!detail ? (
            <Spinner />
          ) : (
            <div className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {detail.employee.profile_pic ? (
                    <img src={detail.employee.profile_pic} className="h-16 w-16 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
                      {detail.employee.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{detail.employee.name}</h2>
                    <p className="text-sm text-slate-500">{detail.employee.job_title || '—'} · {detail.employee.department || '—'}</p>
                    <span className="badge mt-1 bg-brand-100 text-brand-700">{detail.employee.role === 'hr' ? 'HR / Admin' : 'Employee'}</span>
                  </div>
                </div>
                {!editing ? (
                  <button className="btn-primary" onClick={() => setEditing(true)}><FiEdit2 size={15} /> Edit</button>
                ) : (
                  <div className="flex gap-2">
                    <button className="btn-ghost" onClick={() => loadDetail(selectedId)}>Cancel</button>
                    <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                  </div>
                )}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <F label="Full name" k="name" editing={editing} form={form} setForm={setForm} value={detail.employee.name} />
                <F label="Email" k="email" editing={editing} form={form} setForm={setForm} value={detail.employee.email} />
                <F label="Phone" k="phone" editing={editing} form={form} setForm={setForm} value={detail.employee.phone} />
                <F label="Job title" k="job_title" editing={editing} form={form} setForm={setForm} value={detail.employee.job_title} />
                <F label="Department" k="department" editing={editing} form={form} setForm={setForm} value={detail.employee.department} />
                <F label="Date of joining" k="date_of_joining" type="date" editing={editing} form={form} setForm={setForm} value={detail.employee.date_of_joining ? new Date(detail.employee.date_of_joining).toLocaleDateString('en-IN') : '—'} />
                <div className="sm:col-span-2">
                  <F label="Address" k="address" editing={editing} form={form} setForm={setForm} value={detail.employee.address} />
                </div>
                {editing && (
                  <div>
                    <label className="label">Role</label>
                    <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                      <option value="employee">Employee</option>
                      <option value="hr">HR / Admin</option>
                    </select>
                  </div>
                )}
              </div>

              {detail.salary && (
                <div className="mt-6 rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-600">Salary (net / month)</p>
                    <p className="text-lg font-bold text-brand-700">
                      {currency(Number(detail.salary.basic) + Number(detail.salary.hra) + Number(detail.salary.allowances) - Number(detail.salary.deductions))}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Edit detailed structure from the Payroll page.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function F({ label, k, value, editing, form, setForm, type = 'text' }) {
  return (
    <div>
      <p className="label">{label}</p>
      {editing ? (
        <input type={type} className="input" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
      ) : (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{value || '—'}</p>
      )}
    </div>
  );
}
