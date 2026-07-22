import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';
const db = getDb();
export function listRoomsByHotel(hotelId) {
    return db.prepare('SELECT id, hotel_id AS hotelId, name, category, price, inventory, created_at AS createdAt, updated_at AS updatedAt FROM rooms WHERE hotel_id = ? ORDER BY created_at DESC').all(hotelId);
}
export function createRoom(input) {
    const now = new Date().toISOString();
    const room = {
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
