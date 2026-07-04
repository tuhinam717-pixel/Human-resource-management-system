import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Spinner, currency, ExportButton } from '../components/ui';
import { FiEdit2 } from '../components/icons';

const PROFILE_CSV_COLUMNS = [
  { label: 'Employee ID', key: 'employee_code' },
  { label: 'Name', key: 'name' },
  { label: 'Email', key: 'email' },
  { label: 'Phone', key: 'phone' },
  { label: 'Address', key: 'address' },
  { label: 'Job Title', key: 'job_title' },
  { label: 'Department', key: 'department' },
  { label: 'Date of Joining', value: (e) => (e.date_of_joining ? e.date_of_joining.slice(0, 10) : '') },
  { label: 'Basic', value: (e) => e._salary?.basic ?? '' },
  { label: 'HRA', value: (e) => e._salary?.hra ?? '' },
  { label: 'Allowances', value: (e) => e._salary?.allowances ?? '' },
  { label: 'Deductions', value: (e) => e._salary?.deductions ?? '' },
  { label: 'Net Salary', value: (e) => e._net ?? '' },
];

export default function Profile() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    const { data } = await api.get(`/employees/${user.id}`);
    setData(data);
    setForm({
      phone: data.employee.phone || '',
      address: data.employee.address || '',
      profile_pic: data.employee.profile_pic || '',
    });
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      await api.patch(`/employees/${user.id}`, form);
      await load();
      setEditing(false);
      setMsg('Profile updated ✅');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  function onPickImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, profile_pic: reader.result }));
    reader.readAsDataURL(file);
  }

  if (loading) return <Spinner />;

  const emp = data.employee;
  const salary = data.salary;
  const gross = salary ? Number(salary.basic) + Number(salary.hra) + Number(salary.allowances) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        {!editing ? (
          <div className="flex gap-2">
            <ExportButton
              columns={PROFILE_CSV_COLUMNS}
              rows={[{ ...emp, _salary: salary, _net: salary ? gross - Number(salary.deductions) : '' }]}
              filename="my_profile"
              label="Export"
            />
            <button className="btn-primary" onClick={() => setEditing(true)}><FiEdit2 size={15} /> Edit</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => { setEditing(false); load(); }}>Cancel</button>
            <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        )}
      </div>

      {msg && <div className="rounded-lg bg-brand-50 px-4 py-2.5 text-sm text-brand-700">{msg}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: avatar + basics */}
        <div className="card flex flex-col items-center text-center">
          <div className="relative">
            {(editing ? form.profile_pic : emp.profile_pic) ? (
              <img src={editing ? form.profile_pic : emp.profile_pic} alt="" className="h-28 w-28 rounded-full object-cover ring-4 ring-brand-100" />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-brand-100 text-4xl font-bold text-brand-700">
                {emp.name.charAt(0)}
              </div>
            )}
          </div>
          {editing && (
            <label className="mt-3 cursor-pointer text-sm font-semibold text-brand-600 hover:underline">
              Change photo
              <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
            </label>
          )}
          <h2 className="mt-4 text-xl font-bold text-slate-800">{emp.name}</h2>
          <p className="text-sm text-slate-500">{emp.job_title || 'Employee'}</p>
          <span className="badge mt-2 bg-brand-100 text-brand-700">{emp.role === 'hr' ? 'HR / Admin' : 'Employee'}</span>
          <div className="mt-4 w-full space-y-1 text-left text-sm">
            <Row label="Employee ID" value={emp.employee_code} />
            <Row label="Department" value={emp.department || '—'} />
            <Row label="Joined" value={emp.date_of_joining ? new Date(emp.date_of_joining).toLocaleDateString('en-IN') : '—'} />
          </div>
        </div>

        {/* Middle: contact / personal */}
        <div className="card lg:col-span-2">
          <h3 className="mb-4 font-semibold text-slate-700">Personal & Contact</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={emp.name} />
            <Field label="Email" value={emp.email} />
            {editing ? (
              <>
                <EditField label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                <EditField label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
              </>
            ) : (
              <>
                <Field label="Phone" value={emp.phone || '—'} />
                <Field label="Address" value={emp.address || '—'} />
              </>
            )}
          </div>

          <h3 className="mb-4 mt-8 font-semibold text-slate-700">Job details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Job title" value={emp.job_title || '—'} />
            <Field label="Department" value={emp.department || '—'} />
          </div>

          {salary && (
            <>
              <h3 className="mb-4 mt-8 font-semibold text-slate-700">Salary structure <span className="text-xs font-normal text-slate-400">(read-only)</span></h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Basic" value={currency(salary.basic)} />
                <Field label="HRA" value={currency(salary.hra)} />
                <Field label="Allowances" value={currency(salary.allowances)} />
                <Field label="Deductions" value={currency(salary.deductions)} />
                <Field label="Gross" value={currency(gross)} />
                <Field label="Net pay" value={currency(gross - Number(salary.deductions))} highlight />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-1.5">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}

function Field({ label, value, highlight }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className={`rounded-lg bg-slate-50 px-3 py-2 text-sm ${highlight ? 'font-bold text-brand-700' : 'text-slate-700'}`}>{value}</p>
    </div>
  );
}

function EditField({ label, value, onChange }) {
  return (
    <div>
      <p className="label">{label}</p>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
