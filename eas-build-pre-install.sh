#!/usr/bin/env bash
# EAS Build lifecycle hook — runs before "pnpm install --frozen-lockfile".
# Ensures corepack activates the exact pnpm version that generated the lockfile
# so the lockfileVersion '9.0' is accepted instead of being rejected as incompatible.
set -euo pipefail

echo ">>> [eas-build-pre-install] Activating pnpm@10.26.1 via corepack..."
corepack enable
corepack prepare pnpm@10.26.1 --activate
echo ">>> [eas-build-pre-install] pnpm version: $(pnpm --version)"
