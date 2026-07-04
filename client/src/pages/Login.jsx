import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiGrid } from '../components/icons';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  function fillDemo(role) {
    setForm({
      email: role === 'hr' ? 'hr@hrms.com' : 'rahul@hrms.com',
      password: 'Password@123',
    });
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-brand-600 to-brand-700 p-12 text-white lg:flex">
        <div className="flex items-center gap-2 text-xl font-bold">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20"><FiGrid size={18} /></div>
          HRMS
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight">Every workday,<br />perfectly aligned.</h1>
          <p className="mt-4 max-w-sm text-brand-100">
            Onboarding, attendance, leave and payroll — all in one clean, secure workspace.
          </p>
        </div>
        <p className="text-sm text-brand-200">© 2026 HRMS</p>
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-slate-800">Welcome back 👋</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to your HRMS account</p>

          {error && (
            <div className="mt-4 rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 flex gap-2">
            <button onClick={() => fillDemo('hr')} className="btn-ghost flex-1 text-xs">Demo: HR</button>
            <button onClick={() => fillDemo('emp')} className="btn-ghost flex-1 text-xs">Demo: Employee</button>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            No account?{' '}
            <Link to="/signup" className="font-semibold text-brand-600 hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
