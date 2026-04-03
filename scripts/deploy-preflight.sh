#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

fail() {
  echo "ERROR: $1" >&2
  exit 1
}

check_file() {
  local path="$1"
  [[ -f "${path}" ]] || fail "Falta archivo requerido: ${path}"
  echo "OK file: ${path}"
}

check_grep() {
  local pattern="$1"
  local path="$2"
  grep -q "${pattern}" "${path}" || fail "No se encontró '${pattern}' en ${path}"
  echo "OK pattern: ${pattern} (${path})"
}

echo "== SDMX Deploy Preflight =="

if command -v node >/dev/null 2>&1; then
  NODE_VERSION="$(node -v)"
  echo "Node detectado: ${NODE_VERSION}"
  case "${NODE_VERSION}" in
    v22.*) echo "OK Node 22 LTS detectado." ;;
    *)
      echo "WARN: Node local no es 22.x. Para validar frontend usa Node 22 LTS."
      ;;
  esac
else
  echo "WARN: node no está disponible en PATH."
fi

if command -v dotnet >/dev/null 2>&1; then
  echo "dotnet detectado: $(dotnet --version)"
else
  echo "WARN: dotnet no está disponible en PATH."
fi

check_file ".nvmrc"
check_grep '^22$' ".nvmrc"

check_file "render.yaml"
check_grep 'name: sdmx-backend-api' "render.yaml"
check_grep 'healthCheckPath: /api/health' "render.yaml"
check_grep 'Supabase__Url' "render.yaml"
check_grep 'MercadoPago__WebhookBaseUrl' "render.yaml"

check_file "apps/frontend-web/vercel.json"
check_grep '"framework": "nextjs"' "apps/frontend-web/vercel.json"
check_grep '"buildCommand": "npm run build:frontend:lts"' "apps/frontend-web/vercel.json"

check_file "apps/frontend-web/.env.example"
check_grep '^NEXT_PUBLIC_APP_URL=' "apps/frontend-web/.env.example"
check_grep '^NEXT_PUBLIC_SUPABASE_URL=' "apps/frontend-web/.env.example"
check_grep '^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=' "apps/frontend-web/.env.example"
check_grep '^NEXT_PUBLIC_API_BASE_URL=' "apps/frontend-web/.env.example"

check_file "apps/backend-api/appsettings.Production.example.json"
check_grep '"WebhookBaseUrl"' "apps/backend-api/appsettings.Production.example.json"
check_grep '"AccessToken"' "apps/backend-api/appsettings.Production.example.json"

check_file "docs/DEPLOY_RUNBOOK_SDMX.md"
check_file "docs/GO_LIVE_CHECKLIST_SDMX.md"

echo
echo "Preflight terminado."
echo "Si quieres validar endpoints reales, sigue con: npm run go-live:smoke"
