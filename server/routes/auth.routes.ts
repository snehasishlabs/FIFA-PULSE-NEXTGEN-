import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { rateLimiter } from '../middleware/security';

const router = Router();

// Standard rate limiter for auth operations (30 requests per minute)
const authLimiter = rateLimiter(30, 60000);

router.get('/me', authLimiter, requireAuth, AuthController.getMe);
router.post('/profile', authLimiter, requireAuth, AuthController.updateProfile);

export default router;
