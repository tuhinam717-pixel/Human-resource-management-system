import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';
import { Spinner } from './ui';

// Wraps authenticated pages. `hrOnly` restricts to HR/Admin.
export default function ProtectedRoute({ children, hrOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner className="min-h-screen" />;
  if (!user) return <Navigate to="/login" replace />;
  if (hrOnly && user.role !== 'hr') return <Navigate to="/dashboard" replace />;

  return <Layout>{children}</Layout>;
}
