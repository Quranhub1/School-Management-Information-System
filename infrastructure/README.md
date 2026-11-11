# Infrastructure / Deployment

Deployment configuration for the School Management Information System.

## Files

- `Dockerfile` — Multi-stage Docker build for the ASP.NET Core API
- `docker-compose.yml` — Orchestrates PostgreSQL, API, local Nodemailer email service, and Nginx
- `../services/email-service/` — Private Node.js/Nodemailer service with EJS templates and PDFKit receipts
- `systemd/schoolmanagement-email.service` — Local institutional email worker service
- `nginx/nginx.conf` — Reverse proxy configuration
- `.env.example` — Environment variables template

## Quick Start

1. Copy `.env.example` to `.env` and set secure values:
   ```bash
   cp .env.example .env
   # Edit POSTGRES_PASSWORD, JWT_KEY and EMAIL_SERVICE_API_KEY
   # Generate the email service key with: openssl rand -hex 32
   ```

2. Start services:
   ```bash
   docker compose up -d
   ```

3. The API will be available at `http://localhost/api/` and the frontend (once built) at `http://localhost/`.

## Institutional email service

- Set the same random 32+ character `EMAIL_SERVICE_API_KEY` in the API and Node email service configuration.
- Persist ASP.NET Core Data Protection keys: Docker deployments mount `smis_dataprotection` at `/app/dataprotection-keys`; systemd stores them under `/var/lib/schoolmanagement/DataProtectionKeys`. Back up this directory/volume with the database, or encrypted SMTP passwords will become unreadable after key loss.
- Docker Compose keeps the email service on the private service network; do not publish port 5100.
- For systemd deployments, install `schoolmanagement-email.service`, create `/etc/schoolmanagement/email-service.env` with `EMAIL_SERVICE_API_KEY=<same-random-key>`, restrict that file to root/service administrators, and set `EmailService__ApiKey` in the API service to the same key.
- Install the Node service under `/opt/schoolmanagement/email-service` with its production dependencies before enabling the systemd unit.
- Build the Node image or install dependencies on a connected build machine; the running service only connects to the configured SMTP host and does not need npm registry access.

## Production Notes

- Replace the default JWT key with a secure random value (min 32 chars)
- Configure PostgreSQL authentication and network access
- Add TLS certificates to `nginx/ssl/` for HTTPS
- Set up regular database backups (see `database/` directory)
