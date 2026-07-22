# Deployment Guide

## Prerequisites
- Node.js 20+
- Docker and Docker Compose

## Local development
1. Copy `.env.example` to `.env`.
2. Install dependencies with `npm install`.
3. Start the API with `npm start`.
4. Visit `http://localhost:4100/health`.

## Docker
Run:

```bash
docker compose up --build
```

## Production notes
- Replace default secrets.
- Configure a real database and hosting provider.
- Enable HTTPS and reverse proxy.
