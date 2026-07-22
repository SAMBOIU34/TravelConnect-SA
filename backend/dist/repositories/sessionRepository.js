import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';
const db = getDb();
export function createSession(input) {
    const now = new Date().toISOString();
    const session = {
        id: uuidv4(),
        createdAt: now,
        ...input
    };
    db.prepare(`
    INSERT INTO sessions (id, user_id, token, refresh_token, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(session.id, session.userId, session.token, session.refreshToken, session.createdAt, session.expiresAt);
    return session;
}
export function revokeSession(token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}
