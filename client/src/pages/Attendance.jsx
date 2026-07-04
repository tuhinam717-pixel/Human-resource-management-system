import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Spinner, StatusBadge, StatCard, ExportButton } from '../components/ui';
import { FiLogIn, FiLogOut, FiChevronLeft, FiChevronRight, FiCheckCircle, FiXCircle, FiClock, FiUmbrella } from '../components/icons';

const ATTENDANCE_CSV_COLUMNS = [
  { label: 'Date', value: (r) => r.work_date.slice(0, 10) },
  { label: 'Employee', key: 'name' },
  { label: 'Employee ID', key: 'employee_code' },
  { label: 'Status', key: 'status' },
  { label: 'Check In', value: (r) => (r.check_in ? new Date(r.check_in).toLocaleString('en-IN') : '') },
  { label: 'Check Out', value: (r) => (r.check_out ? new Date(r.check_out).toLocaleString('en-IN') : '') },
];

const STATUS_DOT = {
  present: 'bg-emerald-500',
  absent: 'bg-rose-500',
  'half-day': 'bg-amber-500',
  leave: 'bg-sky-500',
};

export default function Attendance() {
  const { user } = useAuth();
  const isHR = user.role === 'hr';

  const [employees, setEmployees] = useState([]);
  const [selectedUser, setSelectedUser] = useState(user.id);
  const [records, setRecords] = useState([]);
  const [today, setToday] = useState(null);
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // HR gets an employee picker.
  useEffect(() => {
    if (isHR) api.get('/employees').then((r) => setEmployees(r.data.employees));
  }, [isHR]);

  async function load() {
    setLoading(true);
    const params = isHR ? { userId: selectedUser } : {};
    const [att, t] = await Promise.all([
      api.get('/attendance', { params }),
      api.get('/attendance/today'),
    ]);
    setRecords(att.data.attendance);
    setToday(t.data.attendance);
    setLoading(false);
  }
  useEffect(() => { load(); }, [selectedUser]);

  async function mark(action) {
    setBusy(true);
    try {
      await api.post(`/attendance/${action}`);
      await load();
    } finally {
      setBusy(false);
    }
  }

  // Map date-string -> status for quick calendar lookup.
  const byDate = useMemo(() => {
    const map = {};
    for (const r of records) map[r.work_date.slice(0, 10)] = r;
    return map;
  }, [records]);

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, 'half-day': 0, leave: 0 };
    for (const r of records) if (c[r.status] !== undefined) c[r.status]++;
    return c;
  }, [records]);

  const grid = useMemo(() => buildMonth(cursor.y, cursor.m), [cursor]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
          <p className="text-slate-500">{isHR ? 'View attendance for any employee.' : 'Your monthly attendance record.'}</p>
        </div>
        <div className="flex items-center gap-2">
          {isHR && (
            <select className="input w-56" value={selectedUser} onChange={(e) => setSelectedUser(Number(e.target.value))}>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name} ({e.employee_code})</option>
              ))}
            </select>
          )}
          {!isHR && (
            <>
              <button className="btn-primary" disabled={busy || !!today?.check_in} onClick={() => mark('check-in')}><FiLogIn size={16} /> Check In</button>
              <button className="btn-ghost" disabled={busy || !today?.check_in || !!today?.check_out} onClick={() => mark('check-out')}><FiLogOut size={16} /> Check Out</button>
            </>
          )}
          <ExportButton columns={ATTENDANCE_CSV_COLUMNS} rows={records} filename="attendance" label="Export" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<FiCheckCircle size={22} className="text-emerald-600" />} label="Present" value={counts.present} />
        <StatCard icon={<FiClock size={22} className="text-amber-600" />} label="Half-day" value={counts['half-day']} />
        <StatCard icon={<FiXCircle size={22} className="text-rose-600" />} label="Absent" value={counts.absent} />
        <StatCard icon={<FiUmbrella size={22} className="text-sky-600" />} label="On leave" value={counts.leave} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <button className="btn-ghost" onClick={() => setCursor(shift(cursor, -1))}><FiChevronLeft size={16} /></button>
            <h3 className="font-semibold text-slate-700">
              {new Date(cursor.y, cursor.m).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </h3>
            <button className="btn-ghost" onClick={() => setCursor(shift(cursor, 1))}><FiChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {grid.map((cell, i) => {
              if (!cell) return <div key={i} />;
              const rec = byDate[cell.iso];
              const isToday = cell.iso === new Date().toISOString().slice(0, 10);
              return (
                <div key={i} className={`flex aspect-square flex-col items-center justify-center rounded-lg text-sm ${isToday ? 'ring-2 ring-brand-400' : 'bg-slate-50'}`}>
                  <span className="text-slate-600">{cell.day}</span>
                  {rec && <span className={`mt-1 h-2 w-2 rounded-full ${STATUS_DOT[rec.status] || 'bg-slate-300'}`} title={rec.status} />}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
            <Legend color="bg-emerald-500" label="Present" />
            <Legend color="bg-amber-500" label="Half-day" />
            <Legend color="bg-rose-500" label="Absent" />
            <Legend color="bg-sky-500" label="Leave" />
          </div>
        </div>

        {/* Recent list (weekly-style view) */}
        <div className="card p-0">
          <h3 className="border-b border-slate-100 px-5 py-3 font-semibold text-slate-700">Recent days</h3>
          <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {records.length === 0 && <p className="px-5 py-6 text-center text-sm text-slate-400">No records.</p>}
            {records.slice(0, 14).map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {new Date(r.work_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                  {r.check_in && (
                    <p className="text-xs text-slate-400">
                      {fmtTime(r.check_in)}{r.check_out ? ` – ${fmtTime(r.check_out)}` : ''}
                    </p>
                  )}
                </div>
                <StatusBadge value={r.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return <span className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${color}`} />{label}</span>;
}

/* helpers */
function buildMonth(year, month) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = Array(first).fill(null);
  for (let d = 1; d <= days; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, iso });
  }
  return cells;
}
function shift({ y, m }, delta) {
  const d = new Date(y, m + delta);
  return { y: d.getFullYear(), m: d.getMonth() };
}
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
