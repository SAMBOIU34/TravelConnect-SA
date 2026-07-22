import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { signToken } from '../lib/auth.js';

describe('hotel and booking persistence', () => {
  it('creates and lists hotels and bookings', async () => {
    const token = signToken({ sub: 'test-user', role: 'admin' });

    const hotelResponse = await request(app)
      .post('/api/hotels')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Cape Heritage Hotel', city: 'Cape Town', country: 'South Africa', status: 'approved' });

    expect(hotelResponse.status).toBe(201);

    const bookingResponse = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ guestName: 'A. Molefe', hotelId: hotelResponse.body.hotel.id, status: 'confirmed' });

    expect(bookingResponse.status).toBe(201);

    const hotelsResponse = await request(app)
      .get('/api/hotels')
      .set('Authorization', `Bearer ${token}`);

    const bookingsResponse = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${token}`);

    expect(hotelsResponse.status).toBe(200);
    expect(bookingsResponse.status).toBe(200);
    expect(hotelsResponse.body.hotels.length).toBeGreaterThan(0);
    expect(bookingsResponse.body.bookings.length).toBeGreaterThan(0);
  });

  it('updates and deletes hotels and bookings', async () => {
    const token = signToken({ sub: 'test-user', role: 'admin' });

    const hotelResponse = await request(app)
      .post('/api/hotels')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Harbor View', city: 'Durban', country: 'South Africa', status: 'pending' });

    const hotelId = hotelResponse.body.hotel.id;

    const bookingResponse = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ guestName: 'N. Khumalo', hotelId, status: 'pending' });

    const bookingId = bookingResponse.body.booking.id;

    const updateHotelResponse = await request(app)
      .put(`/api/hotels/${hotelId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Harbor View Suites', city: 'Durban', country: 'South Africa', status: 'approved' });

    const updateBookingResponse = await request(app)
      .post(`/api/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'confirmed' });

    const deleteBookingResponse = await request(app)
      .delete(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${token}`);

    const deleteHotelResponse = await request(app)
      .delete(`/api/hotels/${hotelId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(updateHotelResponse.status).toBe(200);
    expect(updateHotelResponse.body.hotel.name).toBe('Harbor View Suites');
    expect(updateBookingResponse.status).toBe(200);
    expect(deleteBookingResponse.status).toBe(200);
    expect(deleteHotelResponse.status).toBe(200);
  });

  it('exposes audit logs and role updates for admins', async () => {
    const adminToken = signToken({ sub: 'admin-user', role: 'admin' });
    const uniqueEmail = `role-user-${Date.now()}@example.com`;
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Role User', email: uniqueEmail, password: 'Password123!' });

    const userId = registerResponse.body.user?.id || registerResponse.body.userId;

    const roleResponse = await request(app)
      .put(`/api/users/${userId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' });

    const auditResponse = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(roleResponse.status).toBe(200);
    expect(auditResponse.status).toBe(200);
    expect(auditResponse.body.auditEntries.length).toBeGreaterThan(0);
  });

  it('supports room and availability updates and deletes', async () => {
    const token = signToken({ sub: 'workflow-user', role: 'admin' });
    const hotelResponse = await request(app)
      .post('/api/hotels')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ocean View', city: 'Gqeberha', country: 'South Africa', status: 'pending' });

    const hotelId = hotelResponse.body.hotel.id;
    const roomResponse = await request(app)
      .post(`/api/hotels/${hotelId}/rooms`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Junior Suite', category: 'suite', price: 1200, inventory: 2 });

    const roomId = roomResponse.body.room.id;
    const availabilityResponse = await request(app)
      .post(`/api/hotels/${hotelId}/availability`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId, date: '2026-08-10', available: 1 });

    const availabilityId = availabilityResponse.body.availability.id;

    const updateRoomResponse = await request(app)
      .put(`/api/hotels/${hotelId}/rooms/${roomId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Premier Suite', category: 'suite', price: 1500, inventory: 3 });

    const updateAvailabilityResponse = await request(app)
      .put(`/api/hotels/${hotelId}/availability/${availabilityId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId, date: '2026-08-11', available: 2 });

    const deleteAvailabilityResponse = await request(app)
      .delete(`/api/hotels/${hotelId}/availability/${availabilityId}`)
      .set('Authorization', `Bearer ${token}`);

    const deleteRoomResponse = await request(app)
      .delete(`/api/hotels/${hotelId}/rooms/${roomId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(updateRoomResponse.status).toBe(200);
    expect(updateAvailabilityResponse.status).toBe(200);
    expect(deleteAvailabilityResponse.status).toBe(200);
    expect(deleteRoomResponse.status).toBe(200);
  });
});
