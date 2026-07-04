import { Router } from 'express';
import { signup, signin, me } from '../controllers/auth.controller.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/me', authRequired, me);

export default router;
