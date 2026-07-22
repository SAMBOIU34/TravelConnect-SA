import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';
const db = getDb();
export function listHotels() {
    return db.prepare('SELECT id, name, city, country, status, created_at AS createdAt, updated_at AS updatedAt FROM hotels ORDER BY created_at DESC').all();
}
export function createHotel(input) {
    const now = new Date().toISOString();
    const hotel = {
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
