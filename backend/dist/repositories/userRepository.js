import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';
const db = getDb();
export function listUsers() {
    const rows = db.prepare('SELECT id, name, email, password_hash AS passwordHash, role, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM users ORDER BY created_at DESC').all();
    return rows.map((row) => ({ ...row, isActive: Boolean(row.isActive) }));
}
export function findUserByEmail(email) {
    const row = db.prepare('SELECT id, name, email, password_hash AS passwordHash, role, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE email = ?').get(email.toLowerCase());
    return row ? { ...row, isActive: Boolean(row.isActive) } : undefined;
}
export function createUser(input) {
    const now = new Date().toISOString();
    const user = {
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
