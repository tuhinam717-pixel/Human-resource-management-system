import { Router } from 'express';
import { listEmployees, getEmployee, updateEmployee } from '../controllers/employee.controller.js';
import { authRequired, hrOnly, selfOrHR } from '../middleware/auth.js';

const router = Router();

router.use(authRequired);

router.get('/', hrOnly, listEmployees);
router.get('/:id', selfOrHR('id'), getEmployee);
router.patch('/:id', selfOrHR('id'), updateEmployee);

export default router;
