import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
const JWT_SECRET = process.env.JWT_SECRET || 'travelconnect-secret';
export function hashPassword(password) {
    return bcrypt.hash(password, 10);
}
export function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}
export function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}
export function signRefreshToken(payload) {
    return jwt.sign(payload, `${JWT_SECRET}-refresh`, { expiresIn: '7d' });
}
export function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}
export function verifyRefreshToken(token) {
    return jwt.verify(token, `${JWT_SECRET}-refresh`);
}
