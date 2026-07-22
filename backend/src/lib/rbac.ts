import type { Request, Response, NextFunction } from 'express';
import { hasPermission } from './permissions.js';

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req.user?.role as string) || 'user';
    if (!hasPermission(role, permission)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  };
}
