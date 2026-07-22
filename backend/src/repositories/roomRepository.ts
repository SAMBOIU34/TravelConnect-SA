import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';

export type RoomRecord = {
  id: string;
  hotelId: string;
  name: string;
  category: string;
  price: number;
  inventory: number;
  createdAt: string;
  updatedAt: string;
};

const db = getDb();

export function listRoomsByHotel(hotelId: string) {
  return db.prepare('SELECT id, hotel_id AS hotelId, name, category, price, inventory, created_at AS createdAt, updated_at AS updatedAt FROM rooms WHERE hotel_id = ? ORDER BY created_at DESC').all(hotelId) as RoomRecord[];
}

export function createRoom(input: Omit<RoomRecord, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();
  const room: RoomRecord = {
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
    ...input
  };

  db.prepare(`
    INSERT INTO rooms (id, hotel_id, name, category, price, inventory, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(room.id, room.hotelId, room.name, room.category, room.price, room.inventory, room.createdAt, room.updatedAt);

  return room;
}

export function updateRoom(id: string, input: Partial<Omit<RoomRecord, 'id' | 'createdAt' | 'updatedAt'>>) {
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT id, hotel_id AS hotelId, name, category, price, inventory, created_at AS createdAt, updated_at AS updatedAt FROM rooms WHERE id = ?').get(id) as RoomRecord | undefined;
  if (!existing) return undefined;

  const updates = { ...existing, ...input, updatedAt: now };
  db.prepare(`
    UPDATE rooms
    SET name = ?, category = ?, price = ?, inventory = ?, updated_at = ?
    WHERE id = ?
  `).run(updates.name, updates.category, updates.price, updates.inventory, updates.updatedAt, id);

  return updates as RoomRecord;
}

export function deleteRoom(id: string) {
  const result = db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
  return result.changes > 0;
}
