#!/usr/bin/env bash
set -euo pipefail

# @implements REQ-049 REQ-050 REQ-017 REQ-025 REQ-026 FR-017 FR-025 FR-026 ARCH-012 ARCH-017 ARCH-031 MOD-012 MOD-017 MOD-031

docker compose up -d
npm run local:wait:localstack
npm run local:wait:postgres
npm run local:init

echo "Local identity infra is ready (LocalStack + Postgres + bootstrap schema)."
