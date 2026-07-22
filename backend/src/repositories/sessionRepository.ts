import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';

export type SessionRecord = {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  createdAt: string;
  expiresAt: string;
};

const db = getDb();

export function createSession(input: Omit<SessionRecord, 'id' | 'createdAt'>) {
  const now = new Date().toISOString();
  const session: SessionRecord = {
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

export function revokeSession(token: string) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}
