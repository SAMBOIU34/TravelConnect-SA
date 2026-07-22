import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import { app } from '../index.js';
beforeEach(() => {
    process.env.NODE_ENV = 'test';
});
describe('persistent auth flow', () => {
    it('stores a user after registration and allows login', async () => {
        const uniquePersistEmail = `persist-${Date.now()}@example.com`;
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Persistent User', email: uniquePersistEmail, password: 'StrongPass123' });
        expect(registerResponse.status).toBe(201);
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({ email: uniquePersistEmail, password: 'StrongPass123' });
        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.success).toBe(true);
    });
});
