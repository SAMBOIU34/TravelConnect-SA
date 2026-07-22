const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const request = require('supertest');
const { createApp, resetDatabaseForTests, generateTotpCode } = require('../src/server');

const dbPath = path.join(__dirname, 'travelconnect-test.sqlite');
process.env.TRAVELCONNECT_DB_PATH = dbPath;
process.env.JWT_SECRET = 'test-secret';
process.env.ADMIN_EMAIL = 'admin@example.com';
process.env.ADMIN_PASSWORD = 'Admin123!';

test('registers a tenant and creates an admin user', async () => {
  await resetDatabaseForTests();
  const app = createApp();
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Partner',
      email: 'partner@example.com',
      password: 'StrongPass123!',
      role: 'partner'
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.user.role, 'partner');
});

test('generates a valid TOTP for a known base32 secret', () => {
  const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  const code = generateTotpCode(secret, 59 * 1000);
  assert.equal(code, '287082');
});

test('creates a booking and invoice for a guest', async () => {
  await resetDatabaseForTests();
  const app = createApp();
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Partner Two',
      email: 'partner2@example.com',
      password: 'StrongPass123!',
      role: 'partner'
    });

  const authResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'partner2@example.com',
      password: 'StrongPass123!'
    });

  const bookingResponse = await request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${authResponse.body.token}`)
    .send({
      hotelName: 'The Bay Hotel',
      roomType: 'Deluxe',
      guestName: 'Ada Lovelace',
      guestEmail: 'ada@example.com',
      checkIn: '2026-08-01',
      checkOut: '2026-08-03',
      guests: 2,
      amount: 560,
      currency: 'ZAR'
    });

  assert.equal(bookingResponse.status, 201);
  assert.ok(bookingResponse.body.bookingId);
  assert.ok(bookingResponse.body.invoiceId);
});
