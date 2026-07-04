import { Router } from 'express';
import { getPayroll, listPayroll, updatePayroll } from '../controllers/payroll.controller.js';
import { authRequired, hrOnly, selfOrHR } from '../middleware/auth.js';

const router = Router();

router.use(authRequired);

router.get('/', hrOnly, listPayroll);
router.get('/:userId', selfOrHR('userId'), getPayroll);
router.put('/:userId', hrOnly, updatePayroll);

export default router;
