const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const dotenv = require('dotenv');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

dotenv.config();

const dbPath = process.env.TRAVELCONNECT_DB_PATH || path.join(__dirname, '..', 'travelconnect.sqlite');
const port = Number(process.env.PORT || 4100);
let db = null;
let initializationPromise = null;

function getDatabase() {
  if (!db) {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Database connection error', err.message);
      }
    });
  }
  return db;
}

function runSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function getSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function allSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDatabase().all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function generateBase32Secret(length = 20) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let index = 0; index < length; index += 1) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }
  return secret;
}

function decodeBase32(secret) {
  const normalized = secret.replace(/=+$/g, '').toUpperCase();
  let bits = '';
  for (const char of normalized) {
    const value = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(char);
    if (value < 0) continue;
    bits += value.toString(2).padStart(5, '0');
  }

  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(parseInt(bits.slice(index, index + 8), 2));
  }
  return Buffer.from(bytes);
}

function generateTotpCode(secret, time = Date.now()) {
  let counter = Math.floor(time / 30000);
  const buffer = Buffer.alloc(8);
  for (let index = 7; index >= 0; index -= 1) {
    buffer[index] = counter & 0xff;
    counter >>= 8;
  }
  const key = decodeBase32(secret);
  const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
  const otp = (binary % 1000000).toString().padStart(6, '0');
  return otp;
}

function verifyTotp(secret, code) {
  const window = [0, -1, 1];
  return window.some((offset) => generateTotpCode(secret, Date.now() + offset * 30000) === code);
}

async function initializeDatabase() {
  const schema = `
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'active',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      deletedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      tenantId TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      deletedAt TEXT,
      FOREIGN KEY(tenantId) REFERENCES tenants(id)
    );
    CREATE TABLE IF NOT EXISTS hotels (
      id TEXT PRIMARY KEY,
      tenantId TEXT NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT,
      starRating INTEGER,
      amenities TEXT,
      status TEXT DEFAULT 'pending_review',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      deletedAt TEXT,
      FOREIGN KEY(tenantId) REFERENCES tenants(id)
    );
    CREATE TABLE IF NOT EXISTS hotel_availability (
      id TEXT PRIMARY KEY,
      tenantId TEXT NOT NULL,
      hotelId TEXT NOT NULL,
      roomType TEXT NOT NULL,
      availableDate TEXT NOT NULL,
      availableRooms INTEGER NOT NULL,
      basePrice REAL NOT NULL,
      status TEXT DEFAULT 'open',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      deletedAt TEXT,
      FOREIGN KEY(tenantId) REFERENCES tenants(id),
      FOREIGN KEY(hotelId) REFERENCES hotels(id)
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      tenantId TEXT NOT NULL,
      guestName TEXT NOT NULL,
      guestEmail TEXT NOT NULL,
      hotelName TEXT NOT NULL,
      roomType TEXT NOT NULL,
      checkIn TEXT NOT NULL,
      checkOut TEXT NOT NULL,
      guests INTEGER NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      invoiceId TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      deletedAt TEXT,
      FOREIGN KEY(tenantId) REFERENCES tenants(id)
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      tenantId TEXT NOT NULL,
      bookingId TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      status TEXT DEFAULT 'issued',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      deletedAt TEXT,
      FOREIGN KEY(tenantId) REFERENCES tenants(id),
      FOREIGN KEY(bookingId) REFERENCES bookings(id)
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      tenantId TEXT,
      actor TEXT,
      action TEXT NOT NULL,
      details TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      tenantId TEXT NOT NULL,
      recipient TEXT NOT NULL,
      channel TEXT NOT NULL,
      template TEXT NOT NULL,
      payload TEXT,
      status TEXT DEFAULT 'queued',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS analytics_snapshots (
      id TEXT PRIMARY KEY,
      tenantId TEXT NOT NULL,
      metric TEXT NOT NULL,
      value REAL NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS user_2fa (
      id TEXT PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL,
      secret TEXT NOT NULL,
      enabled INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenantId);
    CREATE INDEX IF NOT EXISTS idx_bookings_tenant ON bookings(tenantId);
    CREATE INDEX IF NOT EXISTS idx_invoices_booking ON invoices(bookingId);
    CREATE INDEX IF NOT EXISTS idx_hotels_tenant ON hotels(tenantId);
    CREATE INDEX IF NOT EXISTS idx_availability_hotel ON hotel_availability(hotelId);
  `;

  await new Promise((resolve, reject) => {
    getDatabase().exec(schema, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

async function recordAuditLog(tenantId, actor, action, details) {
  await runSql('INSERT INTO audit_logs (id, tenantId, actor, action, details) VALUES (?, ?, ?, ?, ?)', [uuidv4(), tenantId, actor, action, details]);
}

async function queueNotification(tenantId, recipient, channel, template, payload) {
  const id = uuidv4();
  await runSql('INSERT INTO notifications (id, tenantId, recipient, channel, template, payload, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, tenantId, recipient, channel, template, JSON.stringify(payload), 'queued']);
  const webhook = channel === 'sms' ? process.env.SMS_WEBHOOK : process.env.EMAIL_WEBHOOK;
  if (!webhook) {
    await runSql('UPDATE notifications SET status = ? WHERE id = ?', ['sent', id]);
    return { id, status: 'sent' };
  }
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ recipient, template, payload })
    });
    await runSql('UPDATE notifications SET status = ? WHERE id = ?', ['sent', id]);
    return { id, status: 'sent' };
  } catch (error) {
    await runSql('UPDATE notifications SET status = ? WHERE id = ?', ['failed', id]);
    return { id, status: 'failed' };
  }
}

async function seedAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const existing = await getSql('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (existing) return;

  const tenantId = uuidv4();
  const tenantSlug = `tenant-${tenantId.slice(0, 8)}`;
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await runSql('INSERT INTO tenants (id, name, slug, status) VALUES (?, ?, ?, ?)', [tenantId, 'Default Admin Tenant', tenantSlug, 'active']);
  await runSql('INSERT INTO users (id, tenantId, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [uuidv4(), tenantId, 'System Admin', adminEmail, passwordHash, 'admin', 'active']);
  await recordAuditLog(tenantId, adminEmail, 'seed_admin', 'Seeded default admin account');
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing auth token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
  app.use(async (req, res, next) => {
    try {
      await ensureInitialized();
      next();
    } catch (error) {
      next(error);
    }
  });

  const swaggerSpec = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: { title: 'TravelConnect SA API', version: '1.0.0' }
    },
    apis: [path.join(__dirname, 'routes', '*.js')]
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password, role = 'partner' } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      const tenantId = uuidv4();
      const tenantSlug = `tenant-${tenantId.slice(0, 8)}`;
      const passwordHash = await bcrypt.hash(password, 10);
      const userId = uuidv4();

      await runSql('INSERT INTO tenants (id, name, slug) VALUES (?, ?, ?)', [tenantId, name, tenantSlug]);
      await runSql('INSERT INTO users (id, tenantId, name, email, password, role) VALUES (?, ?, ?, ?, ?, ?)', [userId, tenantId, name, email, passwordHash, role]);
      await recordAuditLog(tenantId, email, 'register', 'Tenant registered');
      await runSql('INSERT INTO analytics_snapshots (id, tenantId, metric, value) VALUES (?, ?, ?, ?)', [uuidv4(), tenantId, 'registrations', 1]);
      await queueNotification(tenantId, email, 'email', 'welcome_partner', { name });

      const token = jwt.sign({ userId, tenantId, role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '8h' });
      res.status(201).json({ token, user: { id: userId, tenantId, name, email, role } });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password, otp } = req.body;
    try {
      const user = await getSql('SELECT * FROM users WHERE email = ? AND deletedAt IS NULL', [email]);
      if (!user) return res.status(401).json({ message: 'Invalid credentials' });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

      const twoFactor = await getSql('SELECT * FROM user_2fa WHERE userId = ?', [user.id]);
      if (twoFactor && twoFactor.enabled === 1) {
        if (!otp) {
          return res.status(401).json({ message: 'Two-factor code required', requiresTwoFactor: true });
        }
        if (!verifyTotp(twoFactor.secret, otp)) {
          return res.status(401).json({ message: 'Invalid two-factor code' });
        }
      }

      const token = jwt.sign({ userId: user.id, tenantId: user.tenantId, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '8h' });
      res.json({ token, user: { id: user.id, tenantId: user.tenantId, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/auth/2fa/enable', authMiddleware, async (req, res) => {
    try {
      const secret = generateBase32Secret();
      const existing = await getSql('SELECT * FROM user_2fa WHERE userId = ?', [req.user.userId]);
      if (existing) {
        await runSql('UPDATE user_2fa SET secret = ?, enabled = 0 WHERE userId = ?', [secret, req.user.userId]);
      } else {
        await runSql('INSERT INTO user_2fa (id, userId, secret, enabled) VALUES (?, ?, ?, ?)', [uuidv4(), req.user.userId, secret, 0]);
      }
      res.json({ secret, otpUri: `otpauth://totp/TravelConnect:${req.user.userId}?secret=${secret}&issuer=TravelConnect` });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/auth/2fa/verify', authMiddleware, async (req, res) => {
    try {
      const { code } = req.body;
      const record = await getSql('SELECT * FROM user_2fa WHERE userId = ?', [req.user.userId]);
      if (!record) return res.status(404).json({ message: '2FA not configured' });
      if (!verifyTotp(record.secret, code)) return res.status(400).json({ message: 'Invalid code' });
      await runSql('UPDATE user_2fa SET enabled = 1 WHERE userId = ?', [req.user.userId]);
      res.json({ message: '2FA enabled' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
  });

  app.post('/api/users', authMiddleware, async (req, res) => {
    try {
      const { name, email, password, role = 'staff' } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
      }

      const actor = await getSql('SELECT role FROM users WHERE id = ? AND deletedAt IS NULL', [req.user.userId]);
      if (!actor || actor.role !== 'admin') {
        return res.status(403).json({ message: 'Admin only' });
      }

      const existing = await getSql('SELECT id FROM users WHERE email = ? AND deletedAt IS NULL', [email]);
      if (existing) {
        return res.status(409).json({ message: 'User already exists' });
      }

      const userId = uuidv4();
      const passwordHash = await bcrypt.hash(password, 10);
      await runSql('INSERT INTO users (id, tenantId, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [userId, req.user.tenantId, name, email, passwordHash, role, 'active']);
      await recordAuditLog(req.user.tenantId, req.user.userId, 'user_created', `Created user ${email}`);

      res.status(201).json({
        user: {
          id: userId,
          tenantId: req.user.tenantId,
          name,
          email,
          role,
          status: 'active'
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/users', authMiddleware, async (req, res) => {
    try {
      const actor = await getSql('SELECT role FROM users WHERE id = ? AND deletedAt IS NULL', [req.user.userId]);
      if (!actor || actor.role !== 'admin') {
        return res.status(403).json({ message: 'Admin only' });
      }

      const rows = await allSql('SELECT * FROM users WHERE tenantId = ? AND deletedAt IS NULL ORDER BY createdAt DESC', [req.user.tenantId]);
      res.json(rows.map((user) => sanitizeUser(user)));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/users/:id', authMiddleware, async (req, res) => {
    try {
      const actor = await getSql('SELECT role FROM users WHERE id = ? AND deletedAt IS NULL', [req.user.userId]);
      if (!actor || actor.role !== 'admin') {
        return res.status(403).json({ message: 'Admin only' });
      }

      const existingUser = await getSql('SELECT * FROM users WHERE id = ? AND tenantId = ? AND deletedAt IS NULL', [req.params.id, req.user.tenantId]);
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { name, email, role, status, password } = req.body;
      const updates = [];
      const values = [];

      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
      }
      if (email !== undefined) {
        const duplicate = await getSql('SELECT id FROM users WHERE email = ? AND id != ? AND deletedAt IS NULL', [email, req.params.id]);
        if (duplicate) {
          return res.status(409).json({ message: 'User already exists' });
        }
        updates.push('email = ?');
        values.push(email);
      }
      if (role !== undefined) {
        updates.push('role = ?');
        values.push(role);
      }
      if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);
      }
      if (password !== undefined) {
        const passwordHash = await bcrypt.hash(password, 10);
        updates.push('password = ?');
        values.push(passwordHash);
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: 'No updates provided' });
      }

      values.push(req.params.id);
      await runSql(`UPDATE users SET ${updates.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, values);
      const updatedUser = await getSql('SELECT * FROM users WHERE id = ? AND tenantId = ? AND deletedAt IS NULL', [req.params.id, req.user.tenantId]);
      await recordAuditLog(req.user.tenantId, req.user.userId, 'user_updated', `Updated user ${req.params.id}`);
      res.json({ user: sanitizeUser(updatedUser) });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/users/:id', authMiddleware, async (req, res) => {
    try {
      const actor = await getSql('SELECT role FROM users WHERE id = ? AND deletedAt IS NULL', [req.user.userId]);
      if (!actor || actor.role !== 'admin') {
        return res.status(403).json({ message: 'Admin only' });
      }

      const result = await runSql('UPDATE users SET deletedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND tenantId = ? AND deletedAt IS NULL', [req.params.id, req.user.tenantId]);
      if (result.changes === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      await recordAuditLog(req.user.tenantId, req.user.userId, 'user_deleted', `Deleted user ${req.params.id}`);
      res.json({ id: req.params.id, status: 'deleted' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/tenants', authMiddleware, async (req, res) => {
    try {
      const rows = await allSql('SELECT id, name, slug, status, createdAt FROM tenants WHERE deletedAt IS NULL ORDER BY createdAt DESC');
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/partners/portal', authMiddleware, async (req, res) => {
    try {
      const hotels = await allSql('SELECT * FROM hotels WHERE tenantId = ? AND deletedAt IS NULL ORDER BY createdAt DESC', [req.user.tenantId]);
      const bookings = await allSql('SELECT COUNT(*) AS count FROM bookings WHERE tenantId = ? AND deletedAt IS NULL', [req.user.tenantId]);
      const notifications = await allSql('SELECT COUNT(*) AS count FROM notifications WHERE tenantId = ? AND deletedAt IS NULL', [req.user.tenantId]);
      res.json({ hotels, bookings: bookings[0]?.count || 0, notifications: notifications[0]?.count || 0 });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/partners/hotels', authMiddleware, async (req, res) => {
    try {
      const hotelId = uuidv4();
      const { name, location, description, starRating, amenities } = req.body;
      if (!name || !location) return res.status(400).json({ message: 'Hotel name and location are required' });
      await runSql('INSERT INTO hotels (id, tenantId, name, location, description, starRating, amenities, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [hotelId, req.user.tenantId, name, location, description || null, starRating || null, amenities ? JSON.stringify(amenities) : null, 'pending_review']);
      await recordAuditLog(req.user.tenantId, req.user.userId, 'hotel_created', `${name} submitted for review`);
      await queueNotification(req.user.tenantId, req.user.userId, 'email', 'property_review', { name });
      res.status(201).json({ hotelId, status: 'pending_review' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/partners/hotels', authMiddleware, async (req, res) => {
    try {
      const rows = await allSql('SELECT * FROM hotels WHERE tenantId = ? AND deletedAt IS NULL ORDER BY createdAt DESC', [req.user.tenantId]);
      res.json(rows.map((hotel) => ({
        ...hotel,
        amenities: hotel.amenities ? JSON.parse(hotel.amenities) : []
      })));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/admin/hotels', authMiddleware, async (req, res) => {
    try {
      const user = await getSql('SELECT role FROM users WHERE id = ? AND deletedAt IS NULL', [req.user.userId]);
      if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
      const rows = await allSql('SELECT * FROM hotels WHERE deletedAt IS NULL ORDER BY createdAt DESC');
      res.json(rows.map((hotel) => ({
        ...hotel,
        amenities: hotel.amenities ? JSON.parse(hotel.amenities) : []
      })));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/partners/hotels/:hotelId/availability', authMiddleware, async (req, res) => {
    try {
      const availabilityId = uuidv4();
      const { roomType, availableDate, availableRooms, basePrice } = req.body;
      if (!roomType || !availableDate || !availableRooms || !basePrice) return res.status(400).json({ message: 'Availability details are required' });
      await runSql('INSERT INTO hotel_availability (id, tenantId, hotelId, roomType, availableDate, availableRooms, basePrice, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [availabilityId, req.user.tenantId, req.params.hotelId, roomType, availableDate, availableRooms, basePrice, 'open']);
      await recordAuditLog(req.user.tenantId, req.user.userId, 'availability_updated', `Availability updated for ${roomType}`);
      res.status(201).json({ availabilityId, hotelId: req.params.hotelId, roomType, availableDate, availableRooms, basePrice });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/partners/hotels/:hotelId/availability', authMiddleware, async (req, res) => {
    try {
      const rows = await allSql('SELECT * FROM hotel_availability WHERE tenantId = ? AND hotelId = ? AND deletedAt IS NULL ORDER BY availableDate ASC', [req.user.tenantId, req.params.hotelId]);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/bookings', authMiddleware, async (req, res) => {
    try {
      const bookingId = uuidv4();
      const invoiceId = uuidv4();
      const { guestName, guestEmail, hotelName, roomType, checkIn, checkOut, guests, amount, currency = 'ZAR' } = req.body;
      if (!guestName || !guestEmail || !hotelName || !roomType || !checkIn || !checkOut || !guests || !amount) {
        return res.status(400).json({ message: 'Missing booking details' });
      }
      const tenantId = req.user.tenantId;
      await runSql('INSERT INTO bookings (id, tenantId, guestName, guestEmail, hotelName, roomType, checkIn, checkOut, guests, amount, currency, invoiceId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [bookingId, tenantId, guestName, guestEmail, hotelName, roomType, checkIn, checkOut, guests, amount, currency, invoiceId]);
      await runSql('INSERT INTO invoices (id, tenantId, bookingId, amount, currency) VALUES (?, ?, ?, ?, ?)', [invoiceId, tenantId, bookingId, amount, currency]);
      await queueNotification(tenantId, guestEmail, 'email', 'booking_confirmation', { bookingId, hotelName });
      await queueNotification(tenantId, req.user.userId, 'sms', 'booking_alert', { bookingId, hotelName });
      res.status(201).json({ bookingId, invoiceId, status: 'pending' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/bookings/:id/cancel', authMiddleware, async (req, res) => {
    try {
      const result = await runSql('UPDATE bookings SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', ['cancelled', req.params.id]);
      if (result.changes === 0) return res.status(404).json({ message: 'Booking not found' });
      await queueNotification(req.user.tenantId, req.user.userId, 'email', 'booking_cancelled', { bookingId: req.params.id });
      res.json({ status: 'cancelled', bookingId: req.params.id });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/bookings', authMiddleware, async (req, res) => {
    try {
      const rows = await allSql('SELECT * FROM bookings WHERE tenantId = ? AND deletedAt IS NULL ORDER BY createdAt DESC', [req.user.tenantId]);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/invoices', authMiddleware, async (req, res) => {
    try {
      const rows = await allSql('SELECT * FROM invoices WHERE tenantId = ? AND deletedAt IS NULL ORDER BY createdAt DESC', [req.user.tenantId]);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/analytics', authMiddleware, async (req, res) => {
    try {
      const rows = await allSql('SELECT metric, value, createdAt FROM analytics_snapshots WHERE tenantId = ? ORDER BY createdAt DESC LIMIT 20', [req.user.tenantId]);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/admin/analytics', authMiddleware, async (req, res) => {
    try {
      const user = await getSql('SELECT role FROM users WHERE id = ? AND deletedAt IS NULL', [req.user.userId]);
      if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
      const bookings = await allSql('SELECT COUNT(*) AS count, SUM(amount) AS revenue FROM bookings');
      const hotels = await allSql('SELECT COUNT(*) AS count FROM hotels');
      const notifications = await allSql('SELECT COUNT(*) AS count FROM notifications');
      const auditLogs = await allSql('SELECT COUNT(*) AS count FROM audit_logs');
      res.json({ bookings: bookings[0], hotels: hotels[0], notifications: notifications[0], auditLogs: auditLogs[0] });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/admin/audit-logs', authMiddleware, async (req, res) => {
    try {
      const user = await getSql('SELECT role FROM users WHERE id = ? AND deletedAt IS NULL', [req.user.userId]);
      if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
      const rows = await allSql('SELECT * FROM audit_logs ORDER BY createdAt DESC LIMIT 50');
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/admin/hotels/:hotelId/approve', authMiddleware, async (req, res) => {
    try {
      const user = await getSql('SELECT role FROM users WHERE id = ? AND deletedAt IS NULL', [req.user.userId]);
      if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
      const status = req.body.status || 'approved';
      await runSql('UPDATE hotels SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.hotelId]);
      await recordAuditLog(req.user.tenantId, req.user.userId, 'hotel_approved', `Hotel ${req.params.hotelId} updated to ${status}`);
      res.json({ hotelId: req.params.hotelId, status });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/notifications', authMiddleware, async (req, res) => {
    try {
      const rows = await allSql('SELECT * FROM notifications WHERE tenantId = ? ORDER BY createdAt DESC LIMIT 20', [req.user.tenantId]);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/reports', authMiddleware, async (req, res) => {
    try {
      const rows = await allSql('SELECT COUNT(*) AS bookings, SUM(amount) AS revenue FROM bookings WHERE tenantId = ? AND deletedAt IS NULL', [req.user.tenantId]);
      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  return app;
}

async function resetDatabaseForTests() {
  initializationPromise = null;
  if (db) {
    await new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    db = null;
  }
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  await initializeDatabase();
  await seedAdminUser();
  initializationPromise = Promise.resolve();
}

async function bootstrap() {
  await initializeDatabase();
  await seedAdminUser();
}

async function ensureInitialized() {
  if (!initializationPromise) {
    initializationPromise = bootstrap();
  }
  return initializationPromise;
}

const app = createApp();

if (require.main === module) {
  ensureInitialized().catch((error) => console.error('Bootstrap error', error));
  const server = app.listen(port, () => {
    console.log(`TravelConnect API listening on port ${port}`);
  });
  module.exports = { app, server, db: getDatabase(), createApp, resetDatabaseForTests, ensureInitialized, generateTotpCode };
} else {
  module.exports = { app, db: getDatabase(), createApp, resetDatabaseForTests, ensureInitialized, generateTotpCode };
}
