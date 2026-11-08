#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SKIP_FRONTEND=false
SKIP_BACKEND=false

for arg in "$@"; do
  case "$arg" in
    --skip-frontend) SKIP_FRONTEND=true ;;
    --skip-backend) SKIP_BACKEND=true ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

require_command() {
  local command_name="$1"
  local install_hint="$2"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing required command '$command_name'. $install_hint" >&2
    exit 1
  fi
}

echo "SMIS dependency setup"
echo "Repository: $ROOT_DIR"

if [[ "$SKIP_FRONTEND" == false ]]; then
  require_command node "Install Node.js 24 LTS and npm."
  require_command npm "Install npm (normally bundled with Node.js)."
  NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
  if (( NODE_MAJOR < 24 )); then
    echo "Node.js 24 or newer is required; found $(node --version)." >&2
    exit 1
  fi

  echo "Installing exact frontend dependencies from package-lock.json (npm ci)..."
  (cd "$ROOT_DIR/frontend" && npm ci)
fi

if [[ "$SKIP_BACKEND" == false ]]; then
  require_command dotnet "Install the .NET 8 SDK."
  DOTNET_MAJOR="$(dotnet --version | cut -d. -f1)"
  if (( DOTNET_MAJOR < 8 )); then
    echo ".NET 8 SDK or newer is required; found $(dotnet --version)." >&2
    exit 1
  fi

  echo "Restoring all .NET solution dependencies..."
  (cd "$ROOT_DIR/backend" && dotnet restore SchoolManagement.sln)
fi

echo "SMIS dependency setup completed."
echo "Next: (cd frontend && npm run build) and (cd backend && dotnet build SchoolManagement.sln)."
