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
});
