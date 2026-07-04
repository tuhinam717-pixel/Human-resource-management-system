import { Router } from 'express';
import { checkIn, checkOut, listAttendance, todayStatus } from '../controllers/attendance.controller.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.use(authRequired);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/today', todayStatus);
router.get('/', listAttendance);

export default router;
