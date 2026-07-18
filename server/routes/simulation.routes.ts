import { Router } from 'express';
import { SimulationController } from '../controllers/simulation.controller';
import { requireAuth, requireOrganizer } from '../middleware/auth';
import { rateLimiter } from '../middleware/security';

const router = Router();
const simLimiter = rateLimiter(20, 60000);

// Drill creation is limited to staff, organizers, and admins (via requireOrganizer)
router.post('/run', simLimiter, requireAuth, requireOrganizer, SimulationController.run);
router.get('/history', simLimiter, requireAuth, SimulationController.listHistory);
router.get('/:id', simLimiter, requireAuth, SimulationController.getDetails);

export default router;
