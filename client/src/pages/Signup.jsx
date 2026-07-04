import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiGrid } from '../components/icons';

export default function Signup() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    employee_code: '',
    name: '',
    email: '',
    password: '',
    role: 'employee',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signup(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Sign up failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-100">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white"><FiGrid size={18} /></div>
          <span className="text-lg font-bold text-slate-800">Create your HRMS account</span>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Employee ID</label>
              <input className="input" placeholder="EMP010" value={form.employee_code} onChange={set('employee_code')} required />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={set('role')}>
                <option value="employee">Employee</option>
                <option value="hr">HR / Admin</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Full name</label>
            <input className="input" placeholder="John Doe" value={form.name} onChange={set('name')} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="you@company.com" value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" placeholder="Min 8 chars, 1 letter + 1 number" value={form.password} onChange={set('password')} required />
            <p className="mt-1 text-xs text-slate-400">At least 8 characters, including a letter and a number.</p>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
