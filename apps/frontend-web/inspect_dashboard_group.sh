#!/usr/bin/env bash
set -euo pipefail

BASE="$HOME/Servicios-Digitales-MX/apps/frontend-web"
cd "$BASE"

echo "===== ESTRUCTURA DASHBOARD GROUP ====="
find "./src/app/(dashboard)" -maxdepth 4 \( \
  -name "layout.tsx" -o \
  -name "template.tsx" -o \
  -name "page.tsx" -o \
  -name "loading.tsx" -o \
  -name "default.tsx" -o \
  -name "error.tsx" \
\) | sort
echo

echo "===== CONTENIDO DASHBOARD GROUP ====="
find "./src/app/(dashboard)" -maxdepth 4 \( \
  -name "layout.tsx" -o \
  -name "template.tsx" -o \
  -name "page.tsx" -o \
  -name "loading.tsx" -o \
  -name "default.tsx" -o \
  -name "error.tsx" \
\) | sort | while read -r f; do
  echo "----- FILE: $f -----"
  sed -n '1,320p' "$f"
  echo
done

echo "===== BUSQUEDA DE AUTHGUARD / LOGIN VIEJO ====="
grep -Rni ./src \
  --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" \
  -E "AuthGuard|Bienvenido de nuevo|Acceso seguro al ecosistema|Failed to fetch|Entrar al Panel|Volver al inicio|supabase.auth.getSession|router.push\\(\"/login\"\\)|router.replace\\(\"/login\"\\)|window.location.href = \"/billing\"" || true
echo

echo "===== REVISANDO HUB ACTUAL ====="
sed -n '1,260p' "./src/app/(dashboard)/hub/page.tsx"
echo
