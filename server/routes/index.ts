import { Router } from 'express';
import authRoutes from './auth.routes';
import stadiumRoutes from './stadium.routes';
import aiRoutes from './ai.routes';
import simulationRoutes from './simulation.routes';
import notificationRoutes from './notification.routes';
import accessibilityRoutes from './accessibility.routes';
import transportRoutes from './transport.routes';
import navigationRoutes from './navigation.routes';

const rootRouter = Router();

// Mount all subdomain routers
rootRouter.use('/auth', authRoutes);
rootRouter.use('/stadiums', stadiumRoutes);
rootRouter.use('/ai', aiRoutes);
rootRouter.use('/simulations', simulationRoutes);
rootRouter.use('/notifications', notificationRoutes);
rootRouter.use('/accessibility', accessibilityRoutes);
rootRouter.use('/transport', transportRoutes);
rootRouter.use('/navigation', navigationRoutes);

export default rootRouter;
