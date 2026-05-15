#!/usr/bin/env bash
set -euo pipefail

# @implements REQ-049 REQ-050 REQ-017 REQ-025 REQ-026 FR-017 FR-025 FR-026 ARCH-012 ARCH-017 ARCH-031 MOD-012 MOD-017 MOD-031

HOST="${PGHOST:-localhost}"
PORT="${PGPORT:-5432}"
USER="${PGUSER:-identity}"
DB="${PGDATABASE:-identity}"
TIMEOUT="${POSTGRES_WAIT_TIMEOUT_SECONDS:-120}"

start_ts="$(date +%s)"

until docker compose exec -T postgres pg_isready -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" >/dev/null 2>&1; do
    now_ts="$(date +%s)"
    if (( now_ts - start_ts > TIMEOUT )); then
        echo "Timed out waiting for Postgres at ${HOST}:${PORT}/${DB}" >&2
        exit 1
    fi
    sleep 2
done

echo "Postgres ready at ${HOST}:${PORT}/${DB}"
