const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp, resetDatabaseForTests } = require('../src/server');

test('partner portal can register a hotel and availability', { concurrency: false }, async () => {
  await resetDatabaseForTests();
  const app = createApp();

  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Blue Horizon', email: 'partner@example.com', password: 'StrongPass123!', role: 'partner' });

  const token = registerResponse.body.token;
  const hotelResponse = await request(app)
    .post('/api/partners/hotels')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ocean View Suites', location: 'Cape Town' });

  assert.equal(hotelResponse.status, 201);
  const availabilityResponse = await request(app)
    .post(`/api/partners/hotels/${hotelResponse.body.hotelId}/availability`)
    .set('Authorization', `Bearer ${token}`)
    .send({ roomType: 'Deluxe', availableDate: '2026-09-10', availableRooms: 3, basePrice: 1200 });

  assert.equal(availabilityResponse.status, 201);
});

test('admin analytics endpoint returns aggregated metrics', { concurrency: false }, async () => {
  await resetDatabaseForTests();
  const app = createApp();

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@example.com', password: 'Admin123!' });

  const analyticsResponse = await request(app)
    .get('/api/admin/analytics')
    .set('Authorization', `Bearer ${adminLogin.body.token}`);

  assert.equal(analyticsResponse.status, 200);
  assert.ok(analyticsResponse.body.bookings);
});
