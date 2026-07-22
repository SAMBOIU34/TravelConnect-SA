import { Router } from 'express';
import { authMiddleware } from '../lib/middleware.js';

const router = Router();

router.get('/', authMiddleware, (_req, res) => {
  res.json({
    success: true,
    stats: {
      users: 124,
      hotels: 38,
      bookings: 512,
      revenue: 2875000,
      notifications: 7,
      systemHealth: 'Stable'
    },
    recentActivity: [
      { id: '1', action: 'New hotel approved', actor: 'Admin', time: '2m ago' },
      { id: '2', action: 'Booking created', actor: 'Guest', time: '12m ago' }
    ]
  });
});

export default router;
