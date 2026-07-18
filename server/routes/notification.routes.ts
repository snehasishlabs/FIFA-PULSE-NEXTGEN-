import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { requireAuth, requireStaff } from '../middleware/auth';
import { rateLimiter } from '../middleware/security';

const router = Router();
const notifLimiter = rateLimiter(100, 60000);

// SSE connection is public or requires auth but keeps connection alive
router.get('/stream', NotificationController.subscribeSSE);

router.get('/', notifLimiter, NotificationController.list);

// Dispatching notifications requires at least staff/organizer/admin
router.post('/', notifLimiter, requireAuth, requireStaff, NotificationController.create);

export default router;
