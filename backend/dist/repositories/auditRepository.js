import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';
const db = getDb();
export function createAuditEntry(input) {
    const now = new Date().toISOString();
    const record = {
        id: uuidv4(),
        createdAt: now,
        ...input
    };
    db.prepare(`
    INSERT INTO audit_logs (id, entity, action, details, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(record.id, record.entity, record.action, record.details, record.createdAt);
    return record;
}
export function listAuditEntries() {
    return db.prepare('SELECT id, entity, action, details, created_at AS createdAt FROM audit_logs ORDER BY created_at DESC').all();
}
