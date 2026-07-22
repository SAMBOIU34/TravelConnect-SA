import { Router } from 'express';
import { authMiddleware } from '../lib/middleware.js';
import { requirePermission } from '../lib/rbac.js';
import { listUsers } from '../repositories/userRepository.js';
const router = Router();
router.get('/', authMiddleware, requirePermission('read:users'), (_req, res) => {
    res.json({ success: true, users: listUsers() });
});
router.post('/', authMiddleware, requirePermission('write:users'), (_req, res) => {
    res.status(201).json({ success: true, message: 'User created successfully' });
});
export default router;
