#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# School Management Information System — Ubuntu Server Installer
# Target: Ubuntu 22.04 / 24.04 LTS
# Result: .NET 8 API + PostgreSQL + frontend static assets + systemd service
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
INSTALL_DIR="/opt/schoolmanagement"
SERVICE_USER="schoolmanagement"
DB_NAME="school_management"
DB_USER="school_management"
DB_PASS="$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 24)"
JWT_KEY="$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 48)"

echo "============================================================"
echo " SMIS Ubuntu Server Installer"
echo "============================================================"
echo ""

###############################################################################
# 1. Pre-flight checks
###############################################################################
if [[ "$(id -u)" -ne 0 ]]; then
  echo "ERROR: Please run this script as root (sudo)."
  exit 1
fi

if [[ ! -f "${REPO_ROOT}/backend/src/SchoolManagement.Api/SchoolManagement.Api.csproj" ]]; then
  echo "ERROR: Could not locate repository. Run this script from the repo root."
  exit 1
fi

echo "[1/8] Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq \
  ca-certificates \
  curl \
  wget \
  gnupg \
  apt-transport-https \
  software-properties-common \
  postgresql \
  postgresql-contrib \
  nginx \
  ufw \
  jq \
  unzip \
  openssl \
  >/dev/null

###############################################################################
# 2. Install .NET 8 runtime (and SDK for build-time on first install)
###############################################################################
echo "[2/8] Installing .NET 8..."
if ! command -v dotnet >/dev/null 2>&1; then
  wget -q https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/packages-microsoft-prod.deb -O /tmp/packages-microsoft-prod.deb
  dpkg -i /tmp/packages-microsoft-prod.deb >/dev/null
  rm -f /tmp/packages-microsoft-prod.deb
  apt-get update -qq
  apt-get install -y -qq dotnet-sdk-8.0 >/dev/null
  echo "  .NET 8 SDK installed."
else
  echo "  .NET already present: $(dotnet --version)"
fi

###############################################################################
# 3. Configure PostgreSQL
###############################################################################
echo "[3/8] Configuring PostgreSQL..."
PG_VERSION="$(psql --version | awk '{print $3}' | cut -d. -f1)"
PG_HBA="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"
PG_CONF="/etc/postgresql/${PG_VERSION}/main/postgresql.conf"

# Create DB user and database
su - postgres -c "psql -v ON_ERROR_STOP=1 -c \"DO \$\$BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}'; END IF; END\$\$;\""
su - postgres -c "psql -v ON_ERROR_STOP=1 -c \"SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\\gexec\""

# Listen on all interfaces for LAN access
sed -i "s/^#*listen_addresses.*/listen_addresses = '*'/" "${PG_CONF}"
# Allow MD5 auth from LAN (adjust to your subnet if needed)
echo "host    all             all             10.0.0.0/8            md5" >> "${PG_HBA}"
echo "host    all             all             172.16.0.0/12          md5" >> "${PG_HBA}"
echo "host    all             all             192.168.0.0/16         md5" >> "${PG_HBA}"

systemctl enable postgresql >/dev/null 2>&1 || true
systemctl restart postgresql

echo "  PostgreSQL configured. Database '${DB_NAME}' and user '${DB_USER}' ready."

###############################################################################
# 4. Build backend and frontend
###############################################################################
echo "[4/8] Building application..."
mkdir -p "${INSTALL_DIR}"/{api,frontend,logs,migrations}

# Backend
echo "  Building backend..."
pushd "${REPO_ROOT}/backend" >/dev/null
dotnet publish SchoolManagement.sln \
  -c Release \
  -o "${INSTALL_DIR}/api" \
  --no-restore false >/dev/null
popd >/dev/null

# Frontend
echo "  Building frontend..."
pushd "${REPO_ROOT}/frontend" >/dev/null
npm ci --silent >/dev/null 2>&1 || npm install --silent >/dev/null 2>&1
npm run build --silent >/dev/null
cp -r dist/* "${INSTALL_DIR}/frontend/"
popd >/dev/null

echo "  Build complete."

###############################################################################
# 5. Production configuration
###############################################################################
echo "[5/8] Writing production configuration..."

# Detect LAN IP
LAN_IP="$(hostname -I | awk '{print $1}')"
if [[ -z "${LAN_IP}" ]]; then
  LAN_IP="127.0.0.1"
fi

cat > "${INSTALL_DIR}/api/appsettings.Production.json" <<EOF
{
  "ConnectionStrings": {
    "SchoolManagement": "Host=localhost;Port=5432;Database=${DB_NAME};Username=${DB_USER};Password=${DB_PASS}"
  },
  "Authentication": {
    "JwtKey": "${JWT_KEY}",
    "JwtIssuer": "SchoolManagement",
    "JwtAudience": "SchoolManagementClients"
  },
  "LibraryIntegrations": {
    "Koha": { "Enabled": false, "BaseUrl": "http://localhost:8080" },
    "DSpace": { "Enabled": false, "BaseUrl": "http://localhost:4000" }
  },
  "AllowedOrigins": [ "http://${LAN_IP}", "http://${LAN_IP}:80", "http://${LAN_IP}:3000" ],
  "Serilog": {
    "Using": [ "Serilog.Sinks.Console", "Serilog.Sinks.File" ],
    "MinimumLevel": { "Default": "Information", "Override": { "Microsoft": "Warning", "System": "Warning" } },
    "WriteTo": [
      { "Name": "Console" },
      { "Name": "File", "Args": { "path": "${INSTALL_DIR}/logs/smis-.log", "rollingInterval": "Day", "retainedFileCountLimit": 14 } }
    ],
    "Enrich": [ "FromLogContext", "WithMachineName", "WithThreadId" ]
  }
}
EOF

cat > "${INSTALL_DIR}/api/appsettings.json" <<EOF
{
  "ConnectionStrings": {
    "SchoolManagement": "Host=localhost;Port=5432;Database=${DB_NAME};Username=${DB_USER};Password=${DB_PASS}"
  },
  "Authentication": {
    "JwtKey": "${JWT_KEY}"
  },
  "LibraryIntegrations": {
    "Koha": { "Enabled": false, "BaseUrl": "http://localhost:8080" },
    "DSpace": { "Enabled": false, "BaseUrl": "http://localhost:4000" }
  },
  "AllowedHosts": "*"
}
EOF

# Frontend production env
cat > "${INSTALL_DIR}/frontend/.env.production" <<EOF
VITE_API_BASE_URL=http://${LAN_IP}:5000
EOF

# Save credentials to a secure file for the administrator
cat > "${INSTALL_DIR}/DEPLOYMENT_CREDENTIALS.txt" <<EOF
===============================================================================
 SMIS Server Credentials — KEEP SECURE
===============================================================================
Server LAN IP:  ${LAN_IP}
API URL:        http://${LAN_IP}:5000
Frontend URL:   http://${LAN_IP}
Database:       ${DB_NAME}
Database User:  ${DB_USER}
Database Pass:  ${DB_PASS}
JWT Key:        ${JWT_KEY}
${ADMIN_CREDS}
PostgreSQL CLI: sudo -u postgres psql -d ${DB_NAME}
===============================================================================
EOF
chmod 600 "${INSTALL_DIR}/DEPLOYMENT_CREDENTIALS.txt"

echo "  Configuration written to ${INSTALL_DIR}/"
echo "  LAN IP detected: ${LAN_IP}"

###############################################################################
# 6. Database migrations + seed data
###############################################################################
echo "[6/8] Running database migrations and seed data..."
export ASPNETCORE_ENVIRONMENT=Production
export ConnectionStrings__SchoolManagement="Host=localhost;Port=5432;Database=${DB_NAME};Username=${DB_USER};Password=${DB_PASS}"

# Run EF Core migrations (if any exist) and ensure database is created
if [[ -d "${INSTALL_DIR}/api" ]]; then
  pushd "${INSTALL_DIR}/api" >/dev/null
  if ./schoolmanagement database update; then
    echo "  Database migrations applied."
  elif ./schoolmanagement database ensure-created; then
    echo "  Database ensured (no migrations found)."
  else
    echo "  ERROR: Failed to initialize database. Check logs above."
  fi
  popd >/dev/null
fi

# Seed initial admin user
if [[ -f "${INSTALL_DIR}/api/schoolmanagement" ]]; then
  "${INSTALL_DIR}/api/schoolmanagement" --seed || true
fi

# Read generated admin credentials if available
if [[ -f "${INSTALL_DIR}/ADMIN_CREDENTIALS.txt" ]]; then
  ADMIN_CREDS="$(cat "${INSTALL_DIR}/ADMIN_CREDENTIALS.txt")"
else
  ADMIN_CREDS="username: admin\npassword: <check application logs or seed output>"
fi

echo "  Database ready."

###############################################################################
# 7. Systemd service
###############################################################################
echo "[7/8] Creating systemd service..."

if ! id "${SERVICE_USER}" &>/dev/null; then
  useradd --system --no-create-home --shell /usr/sbin/nologin "${SERVICE_USER}"
fi

chown -R "${SERVICE_USER}:${SERVICE_USER}" "${INSTALL_DIR}"

cat > /etc/systemd/system/schoolmanagement.service <<EOF
[Unit]
Description=School Management Information System API
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=notify
User=${SERVICE_USER}
WorkingDirectory=${INSTALL_DIR}/api
ExecStart=${INSTALL_DIR}/api/schoolmanagement
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ConnectionStrings__SchoolManagement=Host=localhost;Port=5432;Database=${DB_NAME};Username=${DB_USER};Password=${DB_PASS}
Environment=Authentication__JwtKey=${JWT_KEY}
Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false
Restart=always
RestartSec=10
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable schoolmanagement.service >/dev/null 2>&1 || true
systemctl restart schoolmanagement.service

echo "  Systemd service created and started."

###############################################################################
# 8. Nginx reverse proxy
###############################################################################
echo "[8/8] Configuring Nginx..."

cat > /etc/nginx/sites-available/schoolmanagement <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 50M;

    # Frontend static assets
    root ${INSTALL_DIR}/frontend;
    index index.html;

    # API reverse proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
    }

    # Health check (direct, no auth)
    location /health {
        proxy_pass http://127.0.0.1:5000/health;
        proxy_set_header Host \$host;
    }

    # SPA fallback
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/schoolmanagement /etc/nginx/sites-enabled/
nginx -t >/dev/null 2>&1 && systemctl enable nginx >/dev/null 2>&1 && systemctl restart nginx || echo "  WARNING: Nginx config test failed."

###############################################################################
# Firewall
###############################################################################
echo "Configuring firewall..."
ufw allow 22/tcp >/dev/null 2>&1 || true
ufw allow 80/tcp >/dev/null 2>&1 || true
ufw allow 443/tcp >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || true

###############################################################################
# Final summary
###############################################################################
echo ""
echo "============================================================"
echo " INSTALLATION COMPLETE"
echo "============================================================"
echo ""
echo "Frontend : http://${LAN_IP}"
echo "API      : http://${LAN_IP}:5000"
echo "Health   : http://${LAN_IP}/health"
echo ""
echo "Login credentials saved to:"
echo "  ${INSTALL_DIR}/DEPLOYMENT_CREDENTIALS.txt"
echo ""
echo "Next steps:"
echo "  1. Open http://${LAN_IP} from a browser on the LAN."
echo "  2. Log in with the credentials from DEPLOYMENT_CREDENTIALS.txt."
echo "  3. Configure KOHA/DSpace URLs in Administration if needed."
echo "  4. Review ${INSTALL_DIR}/DEPLOYMENT_CREDENTIALS.txt for all settings."
echo ""
echo "Service commands:"
echo "  sudo systemctl status schoolmanagement"
echo "  sudo systemctl restart schoolmanagement"
echo "  sudo journalctl -u schoolmanagement -f"
echo "============================================================"
