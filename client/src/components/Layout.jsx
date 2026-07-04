import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome, FiUser, FiUsers, FiCalendar, FiDollarSign, FiUmbrella,
  FiCheckCircle, FiLogOut, FiGrid,
} from './icons';

const EMPLOYEE_NAV = [
  { to: '/dashboard', label: 'Dashboard', Icon: FiHome },
  { to: '/profile', label: 'My Profile', Icon: FiUser },
  { to: '/attendance', label: 'Attendance', Icon: FiCalendar },
  { to: '/leaves', label: 'Leaves', Icon: FiUmbrella },
  { to: '/payroll', label: 'Payroll', Icon: FiDollarSign },
];

const HR_NAV = [
  { to: '/dashboard', label: 'Dashboard', Icon: FiHome },
  { to: '/employees', label: 'Employees', Icon: FiUsers },
  { to: '/attendance', label: 'Attendance', Icon: FiCalendar },
  { to: '/leaves', label: 'Leave Approvals', Icon: FiCheckCircle },
  { to: '/payroll', label: 'Payroll', Icon: FiDollarSign },
  { to: '/profile', label: 'My Profile', Icon: FiUser },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = user?.role === 'hr' ? HR_NAV : EMPLOYEE_NAV;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col bg-white shadow-sm ring-1 ring-slate-100 md:flex">
        <div className="flex items-center gap-2.5 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <FiGrid size={18} />
          </div>
          <div>
            <p className="font-bold leading-tight text-slate-800">HRMS</p>
            <p className="text-[11px] text-slate-400">Every workday, aligned</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <button onClick={handleLogout} className="btn-ghost w-full">
            <FiLogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between bg-white px-6 py-4 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <FiGrid size={16} />
            </div>
            <span className="font-bold text-slate-800">HRMS</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-700">{user?.name}</p>
              <p className="text-xs text-slate-400">
                {user?.role === 'hr' ? 'HR / Admin' : 'Employee'} · {user?.employee_code}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <button onClick={handleLogout} className="btn-ghost md:hidden" title="Logout">
              <FiLogOut size={16} />
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
