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

export function listAvailability(hotelId: string) {
  return db.prepare('SELECT id, hotel_id AS hotelId, room_id AS roomId, date, available, created_at AS createdAt, updated_at AS updatedAt FROM availability WHERE hotel_id = ? ORDER BY date ASC').all(hotelId) as AvailabilityRecord[];
}
