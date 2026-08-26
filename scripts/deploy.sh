#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DIST_DIR="${REPO_ROOT}/dist"
INSTALL_DIR="/opt/schoolmanagement"

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <server-ip> <db-password> [jwt-key]"
  echo "Example: $0 192.168.1.50 MySecurePassword123"
  exit 1
fi

SERVER_IP="$1"
DB_PASS="$2"
JWT_KEY="${3:-$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 48)}"

echo "============================================================"
echo " SMIS Deployment to ${SERVER_IP}"
echo "============================================================"

if [[ ! -d "${DIST_DIR}/api" ]] || [[ ! -d "${DIST_DIR}/frontend" ]]; then
  echo "ERROR: Build artifacts not found in ${DIST_DIR}. Run scripts/build.sh first."
  exit 1
fi

# Package artifacts
DEPLOY_TAR="/tmp/smis-deploy.tar.gz"
tar -czf "${DEPLOY_TAR}" -C "${DIST_DIR}" api frontend

# Copy to server
echo "Copying artifacts to server..."
scp "${DEPLOY_TAR}" "root@${SERVER_IP}:/tmp/"

# Remote install
ssh "root@${SERVER_IP}" bash -s <<REMOTE_SCRIPT
set -euo pipefail
INSTALL_DIR="${INSTALL_DIR}"
DB_PASS="${DB_PASS}"
JWT_KEY="${JWT_KEY}"

echo "Extracting artifacts..."
mkdir -p "\${INSTALL_DIR}"
tar -xzf /tmp/smis-deploy.tar.gz -C "\${INSTALL_DIR}"

echo "Configuring..."
cat > "\${INSTALL_DIR}/api/appsettings.json" <<'EOF'
{
  "ConnectionStrings": {
    "SchoolManagement": "Host=localhost;Port=5432;Database=school_management;Username=school_management;Password=__DB_PASS__"
  },
  "Authentication": { "JwtKey": "__JWT_KEY__" },
  "LibraryIntegrations": {
    "Koha": { "Enabled": false, "BaseUrl": "http://localhost:8080" },
    "DSpace": { "Enabled": false, "BaseUrl": "http://localhost:4000" }
  },
  "AllowedHosts": "*"
}
EOF
sed -i "s|__DB_PASS__|\${DB_PASS}|g" "\${INSTALL_DIR}/api/appsettings.json"
sed -i "s|__JWT_KEY__|\${JWT_KEY}|g" "\${INSTALL_DIR}/api/appsettings.json"

cat > "\${INSTALL_DIR}/frontend/.env.production" <<EOF
VITE_API_BASE_URL=http://${SERVER_IP}:5000
EOF

echo "Restarting service..."
systemctl restart schoolmanagement.service || {
  echo "Service not found. Run setup-server.sh first."
  exit 1
}

echo "Deployment complete."
REMOTE_SCRIPT

echo ""
echo "============================================================"
echo " DEPLOYMENT COMPLETE"
echo "============================================================"
echo "Frontend : http://${SERVER_IP}"
echo "API      : http://${SERVER_IP}:5000"
echo "Health   : http://${SERVER_IP}/health"
echo ""
