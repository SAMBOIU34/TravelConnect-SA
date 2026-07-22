import { Router } from 'express';
import { authMiddleware } from '../lib/middleware.js';
import { requirePermission } from '../lib/rbac.js';
import { listAuditEntries } from '../repositories/auditRepository.js';

const router = Router();

router.get('/', authMiddleware, requirePermission('read:users'), (_req, res) => {
  res.json({ success: true, auditEntries: listAuditEntries() });
});

export default router;
