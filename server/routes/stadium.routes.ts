import { Router } from 'express';
import { StadiumController } from '../controllers/stadium.controller';
import { rateLimiter } from '../middleware/security';

const router = Router();
const getLimiter = rateLimiter(120, 60000); // Higher limits for dashboard GET queries

router.get('/', getLimiter, StadiumController.listStadiums);
router.get('/:id', getLimiter, StadiumController.getStadium);
router.get('/:id/metrics', getLimiter, StadiumController.getMetrics);
router.get('/:id/incidents', getLimiter, StadiumController.getIncidents);

export default router;
