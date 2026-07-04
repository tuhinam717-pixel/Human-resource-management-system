import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Spinner, StatusBadge, EmptyState, ExportButton } from '../components/ui';
import { FiFileText, FiCheck, FiX, FiPlusCircle } from '../components/icons';

const LEAVE_CSV_COLUMNS = [
  { label: 'Employee', key: 'name' },
  { label: 'Employee ID', key: 'employee_code' },
  { label: 'Department', key: 'department' },
  { label: 'Type', key: 'leave_type' },
  { label: 'From', value: (l) => l.start_date.slice(0, 10) },
  { label: 'To', value: (l) => l.end_date.slice(0, 10) },
  { label: 'Days', value: (l) => Math.round((new Date(l.end_date) - new Date(l.start_date)) / 86400000) + 1 },
  { label: 'Status', key: 'status' },
  { label: 'Remarks', key: 'remarks' },
  { label: 'HR Comment', key: 'admin_comment' },
];

export default function Leaves() {
  const { user } = useAuth();
  const isHR = user.role === 'hr';

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ leave_type: 'paid', start_date: '', end_date: '', remarks: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [decision, setDecision] = useState(null); // { leave, status }
  const [comment, setComment] = useState('');

  async function load() {
    const { data } = await api.get('/leaves');
    setLeaves(data.leaves);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function apply(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/leaves', form);
      setForm({ leave_type: 'paid', start_date: '', end_date: '', remarks: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply');
    } finally {
      setBusy(false);
    }
  }

  async function submitDecision() {
    setBusy(true);
    try {
      await api.patch(`/leaves/${decision.leave.id}/decision`, { status: decision.status, admin_comment: comment });
      setDecision(null);
      setComment('');
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
          <h1 className="text-2xl font-bold text-slate-800">{isHR ? 'Leave Approvals' : 'Leaves & Time-Off'}</h1>
          <p className="text-slate-500">{isHR ? 'Review and act on employee requests.' : 'Apply for leave and track your requests.'}</p>
        </div>
        <ExportButton columns={LEAVE_CSV_COLUMNS} rows={leaves} filename="leaves" label="Export" />
      </div>

      <div className={`grid gap-6 ${isHR ? '' : 'lg:grid-cols-3'}`}>
        {/* Apply form (employees only) */}
        {!isHR && (
          <div className="card h-fit">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-700"><FiPlusCircle className="text-brand-600" /> Apply for leave</h3>
            {error && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>}
            <form onSubmit={apply} className="space-y-3">
              <div>
                <label className="label">Leave type</label>
                <select className="input" value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })}>
                  <option value="paid">Paid</option>
                  <option value="sick">Sick</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
              <div>
                <label className="label">From</label>
                <input type="date" className="input" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
              </div>
              <div>
                <label className="label">To</label>
                <input type="date" className="input" value={form.end_date} min={form.start_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
              </div>
              <div>
                <label className="label">Remarks</label>
                <textarea className="input" rows={3} placeholder="Reason for leave…" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
              </div>
              <button className="btn-primary w-full" disabled={busy}>{busy ? 'Submitting…' : 'Submit request'}</button>
            </form>
          </div>
        )}

        {/* List */}
        <div className={isHR ? '' : 'lg:col-span-2'}>
          {leaves.length === 0 ? (
            <EmptyState title="No leave requests" sub={isHR ? 'Employees have not applied yet.' : 'Your requests will appear here.'} />
          ) : (
            <div className="space-y-3">
              {leaves.map((l) => (
                <div key={l.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {isHR && <span className="font-semibold text-slate-800">{l.name}</span>}
                      <StatusBadge value={l.leave_type} />
                      <StatusBadge value={l.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {fmtDate(l.start_date)} → {fmtDate(l.end_date)} · {days(l.start_date, l.end_date)} day(s)
                    </p>
                    {l.remarks && <p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><FiFileText size={12} /> {l.remarks}</p>}
                    {l.admin_comment && <p className="mt-1 text-xs text-brand-600">HR: {l.admin_comment}</p>}
                  </div>
                  {isHR && l.status === 'pending' && (
                    <div className="flex gap-2">
                      <button className="btn-primary" onClick={() => { setDecision({ leave: l, status: 'approved' }); setComment(''); }}><FiCheck size={16} /> Approve</button>
                      <button className="btn-danger" onClick={() => { setDecision({ leave: l, status: 'rejected' }); setComment(''); }}><FiX size={16} /> Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Decision modal */}
      {decision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDecision(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              {decision.status === 'approved'
                ? <><FiCheck className="text-emerald-600" /> Approve leave</>
                : <><FiX className="text-rose-600" /> Reject leave</>}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {decision.leave.name} · {decision.leave.leave_type} · {fmtDate(decision.leave.start_date)} → {fmtDate(decision.leave.end_date)}
            </p>
            <label className="label mt-4">Comment (optional)</label>
            <textarea className="input" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a note for the employee…" />
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setDecision(null)}>Cancel</button>
              <button className={decision.status === 'approved' ? 'btn-primary' : 'btn-danger'} disabled={busy} onClick={submitDecision}>
                {busy ? 'Saving…' : `Confirm ${decision.status}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function days(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000) + 1;
}
