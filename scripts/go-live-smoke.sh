#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTIFACTS_DIR="${ROOT_DIR}/artifacts"
mkdir -p "${ARTIFACTS_DIR}"

STAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="${ARTIFACTS_DIR}/go-live-smoke-${STAMP}.log"

echo "== SDMX Go Live Smoke =="
echo "Log: ${LOG_FILE}"

(
  cd "${ROOT_DIR}"
  bash scripts/release-smoke.sh
) | tee "${LOG_FILE}"

echo
echo "Smoke guardado en: ${LOG_FILE}"
