import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../index.js';
const uniqueEmail = `jane-${Date.now()}@example.com`;
const uniqueDuplicateEmail = `duplicate-${Date.now()}@example.com`;
describe('TravelConnect API', () => {
    it('returns health status', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
    });
    it('registers a new user', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Jane Doe', email: uniqueEmail, password: 'StrongPass123' });
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
    });
    it('prevents duplicate registrations for the same email', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Jane Doe', email: uniqueDuplicateEmail, password: 'StrongPass123' });
        const duplicateResponse = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Jane Doe', email: uniqueDuplicateEmail, password: 'StrongPass123' });
        expect(response.status).toBe(201);
        expect(duplicateResponse.status).toBe(409);
    });
    it('requires auth for protected users endpoint', async () => {
        const response = await request(app).get('/api/users');
        expect(response.status).toBe(401);
    });
});
