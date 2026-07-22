# TravelConnect SA

TravelConnect SA is a foundation-level tourism SaaS platform for TravelConnect Africa (Pty) Ltd. The repository now includes a production-ready hospitality and booking platform foundation with:

- a modular Express backend with authentication, bookings, invoices, and analytics routes
- tenant and partner onboarding flows
- notification queueing for email/SMS-style delivery
- OpenAPI documentation and Swagger UI
- Docker deployment support and automated tests
- a seed admin account and deployment workflow

## Quick start

```bash
npm install
cp .env.example .env
npm start
```

## API highlights

- POST /api/auth/register
- POST /api/auth/login
- GET /api/me
- POST /api/bookings
- POST /api/bookings/:id/cancel
- GET /api/analytics
- GET /api/reports
- GET /api-docs

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md).
