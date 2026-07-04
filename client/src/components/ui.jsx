// Small shared presentational helpers used across pages.
import { FiInbox, FiDownload } from './icons';
import { downloadCSV, stampName } from '../utils/csv';

// Reusable "Export CSV" button. Pass columns ([{label, key|value}]), rows, and a filename base.
export function ExportButton({ columns, rows, filename, label = 'Export CSV', className = 'btn-ghost' }) {
  const disabled = !rows || rows.length === 0;
  return (
    <button
      className={className}
      disabled={disabled}
      title={disabled ? 'Nothing to export' : 'Download as CSV'}
      onClick={() => downloadCSV(stampName(filename), columns, rows)}
    >
      <FiDownload size={16} /> {label}
    </button>
  );
}

export function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center py-10 ${className}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
    </div>
  );
}

const STATUS_STYLES = {
  present: 'bg-emerald-100 text-emerald-700',
  absent: 'bg-rose-100 text-rose-700',
  'half-day': 'bg-amber-100 text-amber-700',
  leave: 'bg-sky-100 text-sky-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  paid: 'bg-brand-100 text-brand-700',
  sick: 'bg-orange-100 text-orange-700',
  unpaid: 'bg-slate-200 text-slate-600',
};

export function StatusBadge({ value }) {
  const cls = STATUS_STYLES[value] || 'bg-slate-100 text-slate-600';
  return <span className={`badge ${cls} capitalize`}>{value}</span>;
}

export function StatCard({ label, value, sub, icon }) {
  return (
    <div className="card flex items-center gap-4">
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-2xl">
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

export function EmptyState({ title, sub }) {
  return (
    <div className="card flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <FiInbox size={24} />
      </div>
      <p className="font-semibold text-slate-700">{title}</p>
      {sub && <p className="mt-1 text-sm text-slate-400">{sub}</p>}
    </div>
  );
}

export function currency(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}
