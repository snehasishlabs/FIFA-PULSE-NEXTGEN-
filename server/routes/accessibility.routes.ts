import { Router } from 'express';
import { AccessibilityController } from '../controllers/accessibility.controller';
import { rateLimiter } from '../middleware/security';

const router = Router();
const getLimiter = rateLimiter(100, 60000);

router.get('/', getLimiter, AccessibilityController.list);
router.get('/:stadiumId', getLimiter, AccessibilityController.getByStadium);

export default router;
