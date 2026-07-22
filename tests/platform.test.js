const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const http = require('node:http');
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

test('admin can manage tenant users', async () => {
  await resetDatabaseForTests();
  const app = createApp();

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@example.com', password: 'Admin123!' });

  const createResponse = await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${adminLogin.body.token}`)
    .send({ name: 'Jane Staff', email: 'jane@example.com', password: 'StrongPass123!', role: 'staff' });

  assert.equal(createResponse.status, 201);
  assert.equal(createResponse.body.user.email, 'jane@example.com');

  const listResponse = await request(app)
    .get('/api/users')
    .set('Authorization', `Bearer ${adminLogin.body.token}`);

  assert.equal(listResponse.status, 200);
  assert.ok(listResponse.body.some((user) => user.email === 'jane@example.com'));

  const updateResponse = await request(app)
    .put(`/api/users/${createResponse.body.user.id}`)
    .set('Authorization', `Bearer ${adminLogin.body.token}`)
    .send({ role: 'manager' });

  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.body.user.role, 'manager');

  const deleteResponse = await request(app)
    .delete(`/api/users/${createResponse.body.user.id}`)
    .set('Authorization', `Bearer ${adminLogin.body.token}`);

  assert.equal(deleteResponse.status, 200);

  const finalListResponse = await request(app)
    .get('/api/users')
    .set('Authorization', `Bearer ${adminLogin.body.token}`);

  assert.equal(finalListResponse.body.some((user) => user.id === createResponse.body.user.id), false);
});

test('admin can process queued notifications', async () => {
  await resetDatabaseForTests();
  const app = createApp();

  const notificationRequests = [];
  const deliveryServer = http.createServer((req, res) => {
    notificationRequests.push(req.url);
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  });

  await new Promise((resolve) => deliveryServer.listen(0, '127.0.0.1', resolve));
  const { port } = deliveryServer.address();
  process.env.EMAIL_WEBHOOK = `http://127.0.0.1:${port}`;
  process.env.SMS_WEBHOOK = `http://127.0.0.1:${port}`;

  try {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Notify Partner',
        email: 'notify@example.com',
        password: 'StrongPass123!',
        role: 'partner'
      });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'Admin123!' });

    const processResponse = await request(app)
      .post('/api/admin/notifications/process')
      .set('Authorization', `Bearer ${adminLogin.body.token}`);

    assert.equal(processResponse.status, 200);
    assert.ok(processResponse.body.processed >= 1);

    const notificationsResponse = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${registerResponse.body.token}`);

    assert.equal(notificationsResponse.status, 200);
    assert.ok(notificationsResponse.body.some((notification) => notification.status === 'sent'));
    assert.ok(notificationRequests.length >= 1);
  } finally {
    await new Promise((resolve, reject) => deliveryServer.close((error) => (error ? reject(error) : resolve())));
    delete process.env.EMAIL_WEBHOOK;
    delete process.env.SMS_WEBHOOK;
  }
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
