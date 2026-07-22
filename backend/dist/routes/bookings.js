import { Router } from 'express';
import { authMiddleware } from '../lib/middleware.js';
import { createBooking, listBookings } from '../repositories/bookingRepository.js';
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
    const newStatus = req.body.status || 'pending';
    createAuditEntry({ entity: 'booking', action: 'status_changed', details: `Booking status updated to ${newStatus}` });
    res.json({ success: true, message: `Booking status updated to ${newStatus}` });
});
export default router;
