import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { requireAuth } from '../middleware/auth';
import { rateLimiter } from '../middleware/security';

const router = Router();
const aiLimiter = rateLimiter(15, 60000); // 15 calls/min limit for heavy AI tasks

router.post('/recommendations', aiLimiter, requireAuth, AIController.getRecommendations);
router.post('/operational-analysis', aiLimiter, requireAuth, AIController.getOperationalAnalysis);
router.post('/emergency-response', aiLimiter, requireAuth, AIController.getEmergencyResponse);

export default router;
