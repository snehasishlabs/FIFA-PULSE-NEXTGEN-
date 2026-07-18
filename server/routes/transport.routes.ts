import { Router } from 'express';
import { TransportController } from '../controllers/transport.controller';
import { rateLimiter } from '../middleware/security';

const router = Router();
const getLimiter = rateLimiter(100, 60000);

router.get('/', getLimiter, TransportController.list);
router.get('/:stadiumId', getLimiter, TransportController.getByStadium);

export default router;
