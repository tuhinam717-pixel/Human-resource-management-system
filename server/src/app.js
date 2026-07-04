import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import leaveRoutes from './routes/leave.routes.js';
import payrollRoutes from './routes/payroll.routes.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
  app.use(express.json({ limit: '5mb' })); // 5mb so base64 profile pics fit

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/leaves', leaveRoutes);
  app.use('/api/payroll', payrollRoutes);

  // 404
  app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

  // Central error handler
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: 'Server error', detail: err.message });
  });

  return app;
}
