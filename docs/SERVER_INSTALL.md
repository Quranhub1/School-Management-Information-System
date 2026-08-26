# Server Installation Guide

## Prerequisites

- Ubuntu Server 22.04 LTS or 24.04 LTS (fresh install recommended)
- Root or sudo access
- Stable LAN connection
- At least 4 GB RAM, 40 GB disk space

## One-Command Installation

```bash
# From the repository root on the server:
sudo bash infrastructure/scripts/setup-server.sh
```

The script will:
1. Install system dependencies (PostgreSQL, Nginx, .NET 8 runtime)
2. Create the database and database user
3. Build the backend and frontend
4. Run database migrations
5. Seed initial admin user
6. Create systemd service for auto-start
7. Configure Nginx as reverse proxy
8. Configure UFW firewall

## Installation Time

Approximately 10–20 minutes depending on internet speed (for .NET download).

## Post-Installation

1. Find the server's LAN IP:
   ```bash
   hostname -I
   ```

2. Open a browser on any LAN computer:
   ```
   http://<SERVER-IP>
   ```

3. Log in with:
   - Username: `admin`
   - Password: `admin123`

4. **Immediately change the default admin password** in Administration.

## Configuration Files

| Path | Purpose |
|------|---------|
| `/opt/schoolmanagement/api/appsettings.json` | Database, JWT, KOHA/DSpace URLs |
| `/opt/schoolmanagement/frontend/.env.production` | Frontend API base URL |
| `/opt/schoolmanagement/DEPLOYMENT_CREDENTIALS.txt` | Auto-generated credentials (keep secure) |

## Service Management

```bash
sudo systemctl status schoolmanagement
sudo systemctl restart schoolmanagement
sudo journalctl -u schoolmanagement -f
```

## Database Access

```bash
sudo -u postgres psql -d school_management
```

## Firewall

The installer opens ports 22 (SSH), 80 (HTTP), and 443 (HTTPS).

```bash
sudo ufw status
```
