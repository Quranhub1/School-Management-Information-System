#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if [[ -n "$(git -C "$ROOT_DIR" status --porcelain)" ]]; then
  echo "Working tree has local changes. Commit or stash them before updating; no files were changed." >&2
  exit 1
fi

git -C "$ROOT_DIR" pull --ff-only
"$ROOT_DIR/setup.sh" "$@"
