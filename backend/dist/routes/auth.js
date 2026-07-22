import { Router } from 'express';
import { validateBody } from '../lib/middleware.js';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from '../lib/validation.js';
import { comparePassword, hashPassword, signRefreshToken, signToken } from '../lib/auth.js';
import { createSession, revokeSession } from '../repositories/sessionRepository.js';
import { createUser, findUserByEmail } from '../repositories/userRepository.js';
const router = Router();
router.post('/register', validateBody(registerSchema), async (req, res) => {
    const { email, password, name } = req.body;
    if (findUserByEmail(email)) {
        return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    const passwordHash = await hashPassword(password);
    const user = createUser({
        name,
        email,
        passwordHash,
        role: 'admin',
        isActive: true
    });
    res.status(201).json({ success: true, message: 'Registration successful', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});
router.post('/login', validateBody(loginSchema), async (req, res) => {
    const { email, password } = req.body;
    const user = findUserByEmail(email);
    if (!user || !user.isActive) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = signToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
    createSession({ userId: user.id, token, refreshToken, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString() });
    res.json({ success: true, token, refreshToken, user: { id: user.id, email: user.email, role: user.role } });
});
router.post('/logout', (req, res) => {
    const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined;
    if (token) {
        revokeSession(token);
    }
    res.json({ success: true, message: 'Logged out successfully' });
});
router.post('/forgot-password', validateBody(forgotPasswordSchema), (_req, res) => {
    res.json({ success: true, message: 'If the account exists, a reset email has been sent' });
});
router.post('/reset-password', validateBody(resetPasswordSchema), async (req, res) => {
    const { password } = req.body;
    const passwordHash = await hashPassword(password);
    res.json({ success: true, message: 'Password reset successfully', passwordHash });
});
export default router;
