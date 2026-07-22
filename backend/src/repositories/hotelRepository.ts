import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';

export type HotelRecord = {
  id: string;
  name: string;
  city: string;
  country: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const db = getDb();

export function listHotels() {
  return db.prepare('SELECT id, name, city, country, status, created_at AS createdAt, updated_at AS updatedAt FROM hotels ORDER BY created_at DESC').all() as HotelRecord[];
}

export function createHotel(input: Omit<HotelRecord, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();
  const hotel: HotelRecord = {
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
    ...input
  };

  db.prepare(`
    INSERT INTO hotels (id, name, city, country, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(hotel.id, hotel.name, hotel.city, hotel.country, hotel.status, hotel.createdAt, hotel.updatedAt);

  return hotel;
}

export function updateHotel(id: string, input: Partial<Omit<HotelRecord, 'id' | 'createdAt' | 'updatedAt'>>) {
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT id, name, city, country, status, created_at AS createdAt, updated_at AS updatedAt FROM hotels WHERE id = ?').get(id) as HotelRecord | undefined;
  if (!existing) return undefined;

  const updates = {
    ...existing,
    ...input,
    updatedAt: now
  };

  db.prepare(`
    UPDATE hotels
    SET name = ?, city = ?, country = ?, status = ?, updated_at = ?
    WHERE id = ?
  `).run(updates.name, updates.city, updates.country, updates.status, updates.updatedAt, id);

  return updates as HotelRecord;
}

export function deleteHotel(id: string) {
  const result = db.prepare('DELETE FROM hotels WHERE id = ?').run(id);
  return result.changes > 0;
}
