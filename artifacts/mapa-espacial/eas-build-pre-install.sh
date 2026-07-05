#!/usr/bin/env bash
# EAS monorepo pre-install hook.
# Runs automatically before EAS executes "pnpm install --frozen-lockfile".
# Pins pnpm explicitly via Corepack so the lockfile version always matches.
set -euo pipefail

echo ">>> Activating corepack with pnpm@10.26.1..."
corepack enable
corepack prepare pnpm@10.26.1 --activate
echo ">>> pnpm version: $(pnpm --version)"
