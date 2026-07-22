import { verifyToken } from './auth.js';
export function validateBody(schema) {
    return (req, res, next) => {
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, error: parsed.error.flatten() });
        }
        req.body = parsed.data;
        next();
    };
}
export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    try {
        const payload = verifyToken(token);
        req.user = payload;
        next();
    }
    catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}
