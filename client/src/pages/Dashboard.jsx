import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatCard, StatusBadge, Spinner, EmptyState } from '../components/ui';
import {
  FiUser, FiCalendar, FiUmbrella, FiDollarSign, FiUsers, FiUserCheck,
  FiClock, FiBriefcase, FiLogIn, FiLogOut, FiArrowRight,
} from '../components/icons';

export default function Dashboard() {
  const { user } = useAuth();
  return user.role === 'hr' ? <HRDashboard /> : <EmployeeDashboard user={user} />;
}

/* ---------------- Employee ---------------- */
function EmployeeDashboard({ user }) {
  const [today, setToday] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [t, l] = await Promise.all([
      api.get('/attendance/today'),
      api.get('/leaves'),
    ]);
    setToday(t.data.attendance);
    setLeaves(l.data.leaves);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function mark(action) {
    setBusy(true);
    try {
      await api.post(`/attendance/${action}`);
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;

  const pending = leaves.filter((l) => l.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Hi {user.name.split(' ')[0]} 👋</h1>
        <p className="text-slate-500">Here's your day at a glance.</p>
      </div>

      {/* Check in / out */}
      <div className="card flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-500">Today's attendance</p>
          <div className="mt-1 flex items-center gap-3">
            <StatusBadge value={today?.status || 'absent'} />
            {today?.check_in && <span className="text-sm text-slate-500">In: {fmtTime(today.check_in)}</span>}
            {today?.check_out && <span className="text-sm text-slate-500">Out: {fmtTime(today.check_out)}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" disabled={busy || !!today?.check_in} onClick={() => mark('check-in')}>
            <FiLogIn size={16} /> Check In
          </button>
          <button className="btn-ghost" disabled={busy || !today?.check_in || !!today?.check_out} onClick={() => mark('check-out')}>
            <FiLogOut size={16} /> Check Out
          </button>
        </div>
      </div>

      {/* Quick access cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <QuickCard to="/profile" Icon={FiUser} label="My Profile" />
        <QuickCard to="/attendance" Icon={FiCalendar} label="Attendance" />
        <QuickCard to="/leaves" Icon={FiUmbrella} label="Leaves" sub={pending ? `${pending} pending` : undefined} />
        <QuickCard to="/payroll" Icon={FiDollarSign} label="Payroll" />
      </div>

      {/* Recent leaves */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-700">Recent leave requests</h2>
        {leaves.length === 0 ? (
          <EmptyState title="No leave requests yet" sub="Apply from the Leaves page." />
        ) : (
          <div className="card divide-y divide-slate-100 p-0">
            {leaves.slice(0, 5).map((l) => (
              <div key={l.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-medium capitalize text-slate-700">{l.leave_type} leave</p>
                  <p className="text-xs text-slate-400">{fmtDate(l.start_date)} → {fmtDate(l.end_date)}</p>
                </div>
                <StatusBadge value={l.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickCard({ to, Icon, label, sub }) {
  return (
    <Link to={to} className="card flex flex-col items-center justify-center gap-2 py-6 text-center transition hover:-translate-y-0.5 hover:shadow-md">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon size={22} />
      </span>
      <span className="font-semibold text-slate-700">{label}</span>
      {sub && <span className="badge bg-amber-100 text-amber-700">{sub}</span>}
    </Link>
  );
}

/* ---------------- HR / Admin ---------------- */
function HRDashboard() {
  const [data, setData] = useState({ employees: [], leaves: [], attendance: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/employees'),
      api.get('/leaves'),
      api.get('/attendance', { params: { from: todayISO() } }),
    ]).then(([e, l, a]) => {
      setData({ employees: e.data.employees, leaves: l.data.leaves, attendance: a.data.attendance });
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;

  const pending = data.leaves.filter((l) => l.status === 'pending');
  const presentToday = data.attendance.filter((a) => a.status === 'present').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">HR Dashboard</h1>
        <p className="text-slate-500">Overview of your workforce.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<FiUsers size={22} className="text-brand-600" />} label="Total employees" value={data.employees.length} />
        <StatCard icon={<FiUserCheck size={22} className="text-emerald-600" />} label="Present today" value={presentToday} />
        <StatCard icon={<FiClock size={22} className="text-amber-600" />} label="Pending leaves" value={pending.length} />
        <StatCard icon={<FiBriefcase size={22} className="text-sky-600" />} label="Departments" value={new Set(data.employees.map((e) => e.department).filter(Boolean)).size} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-700">Pending approvals</h2>
            <Link to="/leaves" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
              View all <FiArrowRight size={14} />
            </Link>
          </div>
          {pending.length === 0 ? (
            <EmptyState title="All caught up!" sub="No leave requests waiting." />
          ) : (
            <div className="card divide-y divide-slate-100 p-0">
              {pending.slice(0, 5).map((l) => (
                <div key={l.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-medium text-slate-700">{l.name}</p>
                    <p className="text-xs capitalize text-slate-400">{l.leave_type} · {fmtDate(l.start_date)} → {fmtDate(l.end_date)}</p>
                  </div>
                  <StatusBadge value={l.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-700">Employees</h2>
            <Link to="/employees" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
              Manage <FiArrowRight size={14} />
            </Link>
          </div>
          <div className="card divide-y divide-slate-100 p-0">
            {data.employees.slice(0, 6).map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {e.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{e.name}</p>
                  <p className="text-xs text-slate-400">{e.job_title || '—'} · {e.department || '—'}</p>
                </div>
                {e.role === 'hr' && <span className="badge bg-brand-100 text-brand-700">HR</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
