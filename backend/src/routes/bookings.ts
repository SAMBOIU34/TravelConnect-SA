import { Router } from 'express';
import { authMiddleware } from '../lib/middleware.js';
import { createBooking, deleteBooking, listBookings, updateBookingStatus } from '../repositories/bookingRepository.js';
import { createAuditEntry } from '../repositories/auditRepository.js';

const router = Router();

router.get('/', authMiddleware, (_req, res) => {
  res.json({ success: true, bookings: listBookings() });
});

router.post('/', authMiddleware, (req, res) => {
  const booking = createBooking({
    guestName: req.body.guestName,
    hotelId: req.body.hotelId,
    status: req.body.status || 'pending'
  });

  createAuditEntry({ entity: 'booking', action: 'created', details: `Booking ${booking.id} created` });

  res.status(201).json({ success: true, message: 'Booking created successfully', booking });
});

router.post('/:bookingId/status', authMiddleware, (req, res) => {
  const bookingId = Array.isArray(req.params.bookingId) ? req.params.bookingId[0] : req.params.bookingId;
  const newStatus = req.body.status || 'pending';
  const booking = updateBookingStatus(bookingId, newStatus);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  createAuditEntry({ entity: 'booking', action: 'status_changed', details: `Booking status updated to ${newStatus}` });
  res.json({ success: true, message: `Booking status updated to ${newStatus}`, booking });
});

router.delete('/:bookingId', authMiddleware, (req, res) => {
  const bookingId = Array.isArray(req.params.bookingId) ? req.params.bookingId[0] : req.params.bookingId;
  const removed = deleteBooking(bookingId);

  if (!removed) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  createAuditEntry({ entity: 'booking', action: 'deleted', details: `Booking ${bookingId} deleted` });
  res.json({ success: true, message: 'Booking deleted successfully' });
});

export default router;
