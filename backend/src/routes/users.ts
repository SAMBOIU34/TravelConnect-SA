import { Router } from 'express';
import { authMiddleware } from '../lib/middleware.js';
import { requirePermission } from '../lib/rbac.js';
import { createAuditEntry } from '../repositories/auditRepository.js';
import { listUsers, updateUserRole } from '../repositories/userRepository.js';

const router = Router();

router.get('/', authMiddleware, requirePermission('read:users'), (_req, res) => {
  res.json({ success: true, users: listUsers() });
});

router.post('/', authMiddleware, requirePermission('write:users'), (_req, res) => {
  res.status(201).json({ success: true, message: 'User created successfully' });
});

router.put('/:userId/role', authMiddleware, requirePermission('write:users'), (req, res) => {
  const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const role = req.body.role || 'admin';
  const user = updateUserRole(userId, role);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  createAuditEntry({ entity: 'user', action: 'role_changed', details: `User ${user.email} role updated to ${role}` });
  res.json({ success: true, message: 'User role updated successfully', user });
});

export default router;
