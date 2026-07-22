import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const db = getDb();

export function listUsers() {
  const rows = db.prepare('SELECT id, name, email, password_hash AS passwordHash, role, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM users ORDER BY created_at DESC').all() as any[];
  return rows.map((row) => ({ ...row, isActive: Boolean(row.isActive) }));
}

export function findUserByEmail(email: string) {
  const row = db.prepare('SELECT id, name, email, password_hash AS passwordHash, role, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE email = ?').get(email.toLowerCase()) as any | undefined;
  return row ? { ...row, isActive: Boolean(row.isActive) } : undefined;
}

export function createUser(input: Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();
  const user: UserRecord = {
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
    ...input
  };

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(user.id, user.name, user.email.toLowerCase(), user.passwordHash, user.role, user.isActive ? 1 : 0, user.createdAt, user.updatedAt);

  return user;
}

export function updateUserRole(id: string, role: string) {
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT id, name, email, password_hash AS passwordHash, role, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE id = ?').get(id) as any | undefined;
  if (!existing) return undefined;

  db.prepare(`
    UPDATE users
    SET role = ?, updated_at = ?
    WHERE id = ?
  `).run(role, now, id);

  return { ...existing, role, updatedAt: now, isActive: Boolean(existing.isActive) } as UserRecord;
}
