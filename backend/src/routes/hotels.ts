import { Router } from 'express';
import { authMiddleware } from '../lib/middleware.js';
import { createHotel, listHotels } from '../repositories/hotelRepository.js';
import { createRoom, listRoomsByHotel } from '../repositories/roomRepository.js';
import { createAvailability, listAvailability } from '../repositories/availabilityRepository.js';
import { createAuditEntry } from '../repositories/auditRepository.js';

const router = Router();

router.get('/', authMiddleware, (_req, res) => {
  res.json({ success: true, hotels: listHotels() });
});

router.post('/', authMiddleware, (req, res) => {
  const hotel = createHotel({
    name: req.body.name,
    city: req.body.city,
    country: req.body.country || 'South Africa',
    status: req.body.status || 'pending'
  });

  createAuditEntry({ entity: 'hotel', action: 'created', details: `Hotel ${hotel.name} registered` });

  res.status(201).json({ success: true, message: 'Hotel registered successfully', hotel });
});

router.post('/:hotelId/approve', authMiddleware, (req, res) => {
  const hotelId = Array.isArray(req.params.hotelId) ? req.params.hotelId[0] : req.params.hotelId;
  createAuditEntry({ entity: 'hotel', action: 'approved', details: `Hotel ${hotelId} approved` });
  res.json({ success: true, message: 'Hotel approved' });
});

router.post('/:hotelId/rooms', authMiddleware, (req, res) => {
  const hotelId = Array.isArray(req.params.hotelId) ? req.params.hotelId[0] : req.params.hotelId;
  const room = createRoom({
    hotelId,
    name: req.body.name,
    category: req.body.category || 'standard',
    price: Number(req.body.price || 0),
    inventory: Number(req.body.inventory || 1)
  });

  createAuditEntry({ entity: 'room', action: 'created', details: `Room ${room.name} added to hotel ${hotelId}` });

  res.status(201).json({ success: true, room });
});

router.get('/:hotelId/rooms', authMiddleware, (req, res) => {
  const hotelId = Array.isArray(req.params.hotelId) ? req.params.hotelId[0] : req.params.hotelId;
  res.json({ success: true, rooms: listRoomsByHotel(hotelId) });
});

router.post('/:hotelId/availability', authMiddleware, (req, res) => {
  const hotelId = Array.isArray(req.params.hotelId) ? req.params.hotelId[0] : req.params.hotelId;
  const slot = createAvailability({
    hotelId,
    roomId: req.body.roomId,
    date: req.body.date,
    available: Number(req.body.available || 1)
  });

  createAuditEntry({ entity: 'availability', action: 'created', details: `Availability set for ${hotelId}` });

  res.status(201).json({ success: true, availability: slot });
});

router.get('/:hotelId/availability', authMiddleware, (req, res) => {
  const hotelId = Array.isArray(req.params.hotelId) ? req.params.hotelId[0] : req.params.hotelId;
  res.json({ success: true, availability: listAvailability(hotelId) });
});

export default router;
