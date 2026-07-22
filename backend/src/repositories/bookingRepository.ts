import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';

export type BookingRecord = {
  id: string;
  guestName: string;
  hotelId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const db = getDb();

export function listBookings() {
  return db.prepare('SELECT id, guest_name AS guestName, hotel_id AS hotelId, status, created_at AS createdAt, updated_at AS updatedAt FROM bookings ORDER BY created_at DESC').all() as BookingRecord[];
}

export function createBooking(input: Omit<BookingRecord, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date().toISOString();
  const booking: BookingRecord = {
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

export function updateBookingStatus(id: string, status: string) {
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT id, guest_name AS guestName, hotel_id AS hotelId, status, created_at AS createdAt, updated_at AS updatedAt FROM bookings WHERE id = ?').get(id) as BookingRecord | undefined;
  if (!existing) return undefined;

  db.prepare(`
    UPDATE bookings
    SET status = ?, updated_at = ?
    WHERE id = ?
  `).run(status, now, id);

  return { ...existing, status, updatedAt: now } as BookingRecord;
}

export function deleteBooking(id: string) {
  const result = db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
  return result.changes > 0;
}
