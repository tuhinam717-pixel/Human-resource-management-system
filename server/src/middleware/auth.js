import { verifyToken } from '../utils/jwt.js';

// Verifies the Bearer token and attaches { id, role } to req.user.
export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Generic role guard: requireRole('hr') or requireRole('hr', 'employee').
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied — requires role: ${roles.join(' or ')}` });
    }
    next();
  };
}

// Convenience guard for HR/Admin-only routes.
export const hrOnly = requireRole('hr');

// Ownership guard: allow HR through, otherwise the route param must match the
// authenticated user's own id. `param` is the route param holding the target id.
export function selfOrHR(param = 'id') {
  return (req, res, next) => {
    if (req.user?.role === 'hr') return next();
    if (Number(req.params[param]) === req.user?.id) return next();
    return res.status(403).json({ message: 'You can only access your own records' });
  };
}
