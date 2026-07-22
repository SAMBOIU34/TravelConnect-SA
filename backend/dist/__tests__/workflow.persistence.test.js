import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { signToken } from '../lib/auth.js';
describe('hotel workflow persistence', () => {
    it('creates rooms, availability slots, and booking status transitions', async () => {
        const token = signToken({ sub: 'workflow-user', role: 'admin' });
        const hotelResponse = await request(app)
            .post('/api/hotels')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Workflow Hotel', city: 'Durban', country: 'South Africa', status: 'pending' });
        const hotelId = hotelResponse.body.hotel.id;
        const roomResponse = await request(app)
            .post(`/api/hotels/${hotelId}/rooms`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Ocean Suite', category: 'deluxe', price: 1800, inventory: 4 });
        const availabilityResponse = await request(app)
            .post(`/api/hotels/${hotelId}/availability`)
            .set('Authorization', `Bearer ${token}`)
            .send({ roomId: roomResponse.body.room.id, date: '2026-08-01', available: 3 });
        const bookingResponse = await request(app)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({ guestName: 'M. Pietersen', hotelId, status: 'pending' });
        const statusResponse = await request(app)
            .post(`/api/bookings/${bookingResponse.body.booking.id}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'confirmed' });
        expect(hotelResponse.status).toBe(201);
        expect(roomResponse.status).toBe(201);
        expect(availabilityResponse.status).toBe(201);
        expect(bookingResponse.status).toBe(201);
        expect(statusResponse.status).toBe(200);
    });
});
