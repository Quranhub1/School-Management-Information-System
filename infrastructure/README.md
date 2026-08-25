# Infrastructure / Deployment

Deployment configuration for the School Management Information System.

## Files

- `Dockerfile` — Multi-stage Docker build for the ASP.NET Core API
- `docker-compose.yml` — Orchestrates PostgreSQL, API, and Nginx
- `nginx/nginx.conf` — Reverse proxy configuration
- `.env.example` — Environment variables template

## Quick Start

1. Copy `.env.example` to `.env` and set secure values:
   ```bash
   cp .env.example .env
   # Edit POSTGRES_PASSWORD and JWT_KEY
   ```

2. Start services:
   ```bash
   docker compose up -d
   ```

3. The API will be available at `http://localhost/api/` and the frontend (once built) at `http://localhost/`.

## Production Notes

- Replace the default JWT key with a secure random value (min 32 chars)
- Configure PostgreSQL authentication and network access
- Add TLS certificates to `nginx/ssl/` for HTTPS
- Set up regular database backups (see `database/` directory)
