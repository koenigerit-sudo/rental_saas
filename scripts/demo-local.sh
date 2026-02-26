#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="deploy/docker-compose.local-demo.yml"

wait_for_url() {
  local url="$1"
  local max_attempts="${2:-60}"
  local sleep_seconds="${3:-2}"

  local i=1
  while [ "$i" -le "$max_attempts" ]; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    echo "[wait] $url ($i/$max_attempts)"
    sleep "$sleep_seconds"
    i=$((i + 1))
  done

  echo "[error] timeout waiting for $url"
  return 1
}

echo "[1/5] Starting local demo stack..."
docker compose -f "$COMPOSE_FILE" up -d --build

echo "[2/5] Waiting for API..."
wait_for_url "http://localhost:3000/health"

echo "[3/5] Waiting for Web..."
wait_for_url "http://localhost:3001/health"

echo "[4/5] Fetching demo context..."
curl -fsS http://localhost:3000/v1/demo/context | sed 's/^/[demo-context] /'

echo "[5/5] Creating quote..."
curl -fsS -X POST http://localhost:3000/v1/quotes \
  -H 'Content-Type: application/json' \
  -d '{
    "tenant_id": "11111111-1111-1111-1111-111111111111",
    "pickup_location_id": "22222222-2222-2222-2222-222222222222",
    "pickup_at": "2026-03-01T10:00:00.000Z",
    "dropoff_at": "2026-03-03T10:00:00.000Z",
    "vehicle_class": "adventure"
  }' | sed 's/^/[quote] /'

echo

echo "✅ Demo läuft."
echo "API: http://localhost:3000/health"
echo "Web: http://localhost:3001/"
echo "Stoppen: docker compose -f $COMPOSE_FILE down"
