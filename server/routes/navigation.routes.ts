import { Router } from 'express';
import { NavigationController } from '../controllers/navigation.controller';
import { requireAuth } from '../middleware/auth';
import { rateLimiter } from '../middleware/security';

const router = Router();
const navLimiter = rateLimiter(20, 60000); // 20 requests/minute limit for maps and route planning

router.post('/route', navLimiter, requireAuth, NavigationController.getOptimalRoute);
router.post('/advisor', navLimiter, requireAuth, NavigationController.askRouteAdvisor);

export default router;
