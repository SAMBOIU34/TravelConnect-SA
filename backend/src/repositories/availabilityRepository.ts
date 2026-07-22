import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';

export type AvailabilityRecord = {
  id: string;
  hotelId: string;
  roomId: string;
  date: string;
  available: number;
  createdAt: string;
  updatedAt: string;
};

const db = getDb();

export function createAvailability(input: Omit<AvailabilityRecord, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();
  const record: AvailabilityRecord = {
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
    ...input
  };

  db.prepare(`
    INSERT INTO availability (id, hotel_id, room_id, date, available, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(record.id, record.hotelId, record.roomId, record.date, record.available, record.createdAt, record.updatedAt);

  return record;
}

export function updateAvailability(id: string, input: Partial<Omit<AvailabilityRecord, 'id' | 'createdAt' | 'updatedAt'>>) {
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT id, hotel_id AS hotelId, room_id AS roomId, date, available, created_at AS createdAt, updated_at AS updatedAt FROM availability WHERE id = ?').get(id) as AvailabilityRecord | undefined;
  if (!existing) return undefined;

  const updates = { ...existing, ...input, updatedAt: now };
  db.prepare(`
    UPDATE availability
    SET room_id = ?, date = ?, available = ?, updated_at = ?
    WHERE id = ?
  `).run(updates.roomId, updates.date, updates.available, updates.updatedAt, id);

  return updates as AvailabilityRecord;
}

export function deleteAvailability(id: string) {
  const result = db.prepare('DELETE FROM availability WHERE id = ?').run(id);
  return result.changes > 0;
}

export function listAvailability(hotelId: string) {
  return db.prepare('SELECT id, hotel_id AS hotelId, room_id AS roomId, date, available, created_at AS createdAt, updated_at AS updatedAt FROM availability WHERE hotel_id = ? ORDER BY date ASC').all(hotelId) as AvailabilityRecord[];
}
