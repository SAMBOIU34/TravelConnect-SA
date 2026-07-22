import { hasPermission } from './permissions.js';
export function requirePermission(permission) {
    return (req, res, next) => {
        const role = req.user?.role || 'user';
        if (!hasPermission(role, permission)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        next();
    };
}
