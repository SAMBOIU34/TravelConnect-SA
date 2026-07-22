import { Router } from 'express';
import { authMiddleware } from '../lib/middleware.js';
import { createHotel, deleteHotel, listHotels, updateHotel } from '../repositories/hotelRepository.js';
import { createRoom, deleteRoom, listRoomsByHotel, updateRoom } from '../repositories/roomRepository.js';
import { createAvailability, deleteAvailability, listAvailability, updateAvailability } from '../repositories/availabilityRepository.js';
import { createAuditEntry } from '../repositories/auditRepository.js';

const router = Router();

router.get('/', authMiddleware, (_req, res) => {
  res.json({ success: true, hotels: listHotels() });
});

router.post('/', authMiddleware, (req, res) => {
  const name = String(req.body.name || '').trim();
  const city = String(req.body.city || '').trim();
  const country = String(req.body.country || 'South Africa').trim();
  const status = String(req.body.status || 'pending').trim();

  if (!name || !city) {
    return res.status(400).json({ success: false, message: 'Hotel name and city are required' });
  }

  const hotel = createHotel({
    name,
    city,
    country: country || 'South Africa',
    status: status || 'pending'
  });

  createAuditEntry({ entity: 'hotel', action: 'created', details: `Hotel ${hotel.name} registered` });

  res.status(201).json({ success: true, message: 'Hotel registered successfully', hotel });
});

router.put('/:hotelId', authMiddleware, (req, res) => {
  const hotelId = Array.isArray(req.params.hotelId) ? req.params.hotelId[0] : req.params.hotelId;
  const hotel = updateHotel(hotelId, {
    name: req.body.name,
    city: req.body.city,
    country: req.body.country,
    status: req.body.status
  });

  if (!hotel) {
    return res.status(404).json({ success: false, message: 'Hotel not found' });
  }

  createAuditEntry({ entity: 'hotel', action: 'updated', details: `Hotel ${hotel.name} updated` });
  res.json({ success: true, message: 'Hotel updated successfully', hotel });
});

router.delete('/:hotelId', authMiddleware, (req, res) => {
  const hotelId = Array.isArray(req.params.hotelId) ? req.params.hotelId[0] : req.params.hotelId;
  const removed = deleteHotel(hotelId);

  if (!removed) {
    return res.status(404).json({ success: false, message: 'Hotel not found' });
  }

  createAuditEntry({ entity: 'hotel', action: 'deleted', details: `Hotel ${hotelId} deleted` });
  res.json({ success: true, message: 'Hotel deleted successfully' });
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

router.put('/:hotelId/rooms/:roomId', authMiddleware, (req, res) => {
  const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
  const room = updateRoom(roomId, {
    name: req.body.name,
    category: req.body.category,
    price: req.body.price !== undefined ? Number(req.body.price) : undefined,
    inventory: req.body.inventory !== undefined ? Number(req.body.inventory) : undefined
  });

  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }

  createAuditEntry({ entity: 'room', action: 'updated', details: `Room ${room.name} updated` });
  res.json({ success: true, room });
});

router.delete('/:hotelId/rooms/:roomId', authMiddleware, (req, res) => {
  const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
  const removed = deleteRoom(roomId);
  if (!removed) {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }

  createAuditEntry({ entity: 'room', action: 'deleted', details: `Room ${roomId} deleted` });
  res.json({ success: true, message: 'Room deleted successfully' });
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

router.put('/:hotelId/availability/:availabilityId', authMiddleware, (req, res) => {
  const availabilityId = Array.isArray(req.params.availabilityId) ? req.params.availabilityId[0] : req.params.availabilityId;
  const slot = updateAvailability(availabilityId, {
    roomId: req.body.roomId,
    date: req.body.date,
    available: req.body.available !== undefined ? Number(req.body.available) : undefined
  });

  if (!slot) {
    return res.status(404).json({ success: false, message: 'Availability slot not found' });
  }

  createAuditEntry({ entity: 'availability', action: 'updated', details: `Availability ${availabilityId} updated` });
  res.json({ success: true, availability: slot });
});

router.delete('/:hotelId/availability/:availabilityId', authMiddleware, (req, res) => {
  const availabilityId = Array.isArray(req.params.availabilityId) ? req.params.availabilityId[0] : req.params.availabilityId;
  const removed = deleteAvailability(availabilityId);
  if (!removed) {
    return res.status(404).json({ success: false, message: 'Availability slot not found' });
  }

  createAuditEntry({ entity: 'availability', action: 'deleted', details: `Availability ${availabilityId} deleted` });
  res.json({ success: true, message: 'Availability deleted successfully' });
});

export default router;
