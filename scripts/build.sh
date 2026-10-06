#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONFIG="${1:-production}"

echo "============================================================"
echo " SMIS Production Build"
echo "============================================================"

mkdir -p "${REPO_ROOT}/dist/api" "${REPO_ROOT}/dist/frontend"

echo "[1/3] Building backend..."
pushd "${REPO_ROOT}/backend" >/dev/null
dotnet publish SchoolManagement.sln \
  -c Release \
  -o "${REPO_ROOT}/dist/api" \
  --no-restore false
popd >/dev/null

echo "[2/3] Building frontend..."
pushd "${REPO_ROOT}/frontend" >/dev/null
npm ci --silent >/dev/null 2>&1 || npm install --silent >/dev/null 2>&1
npm run build --silent
cp -r dist/* "${REPO_ROOT}/dist/frontend/"
popd >/dev/null

echo "[3/3] Build artifacts ready in: ${REPO_ROOT}/dist"
echo "  API       : ${REPO_ROOT}/dist/api"
echo "  Frontend  : ${REPO_ROOT}/dist/frontend"
echo ""
echo "Next: run infrastructure/scripts/deploy.sh <server-ip> <db-pass>"
