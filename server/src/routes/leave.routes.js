import { Router } from 'express';
import { applyLeave, listLeaves, decideLeave } from '../controllers/leave.controller.js';
import { authRequired, hrOnly } from '../middleware/auth.js';

const router = Router();

router.use(authRequired);

router.post('/', applyLeave);
router.get('/', listLeaves);
router.patch('/:id/decision', hrOnly, decideLeave);

export default router;
