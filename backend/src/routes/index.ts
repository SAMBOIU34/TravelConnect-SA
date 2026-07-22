import { Router, type Express } from 'express';
import authRoutes from './auth.js';
import usersRoutes from './users.js';
import hotelsRoutes from './hotels.js';
import bookingsRoutes from './bookings.js';
import dashboardRoutes from './dashboard.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/hotels', hotelsRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/dashboard', dashboardRoutes);

export function registerRoutes(app: Express) {
  app.use('/api', router);
}
