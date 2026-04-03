#!/usr/bin/env bash

set -euo pipefail

FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
BACKEND_URL="${BACKEND_URL:-http://localhost:5111}"
SUBSCRIBE_PAYLOAD="${SUBSCRIBE_PAYLOAD:-}"

echo "== SDMX Release Smoke =="
echo "Frontend: ${FRONTEND_URL}"
echo "Backend:  ${BACKEND_URL}"

curl_check() {
  local method="$1"
  local url="$2"
  local body="${3:-}"

  echo
  echo "-- ${method} ${url}"

  if [[ -n "${body}" ]]; then
    curl -sS -i -X "${method}" \
      -H 'Content-Type: application/json' \
      --data "${body}" \
      "${url}"
  else
    curl -sS -i -X "${method}" "${url}"
  fi
}

curl_check GET "${BACKEND_URL}/api/health"
curl_check GET "${FRONTEND_URL}/api/payments/plans"

if [[ -n "${SUBSCRIBE_PAYLOAD}" ]]; then
  curl_check POST "${FRONTEND_URL}/api/payments/subscribe" "${SUBSCRIBE_PAYLOAD}"
else
  echo
  echo "-- POST ${FRONTEND_URL}/api/payments/subscribe"
  echo "SKIP: define SUBSCRIBE_PAYLOAD para validar checkout real."
fi

curl_check POST "${FRONTEND_URL}/api/payments/create" '{}'
curl_check GET "${FRONTEND_URL}/login"
curl_check GET "${FRONTEND_URL}/hub"

echo
echo "Smoke terminado."
