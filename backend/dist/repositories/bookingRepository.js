import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';
const db = getDb();
export function listBookings() {
    return db.prepare('SELECT id, guest_name AS guestName, hotel_id AS hotelId, status, created_at AS createdAt, updated_at AS updatedAt FROM bookings ORDER BY created_at DESC').all();
}
export function createBooking(input) {
    const now = new Date().toISOString();
    const booking = {
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
        ...input
    };
    db.prepare(`
    INSERT INTO bookings (id, guest_name, hotel_id, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(booking.id, booking.guestName, booking.hotelId, booking.status, booking.createdAt, booking.updatedAt);
    return booking;
}
