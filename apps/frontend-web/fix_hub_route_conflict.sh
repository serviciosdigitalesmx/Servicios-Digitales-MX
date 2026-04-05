#!/usr/bin/env bash
set -euo pipefail

BASE="$HOME/Servicios-Digitales-MX/apps/frontend-web"

echo "===== REVISANDO RUTAS HUB ====="
find "$BASE/src/app" -path "*/hub/page.tsx" | sort
echo

# Eliminar la ruta nueva duplicada si existe
if [ -f "$BASE/src/app/hub/page.tsx" ]; then
  rm -f "$BASE/src/app/hub/page.tsx"
  echo "Eliminado: $BASE/src/app/hub/page.tsx"
else
  echo "No existía duplicado en src/app/hub/page.tsx"
fi

echo
echo "===== RUTAS HUB RESTANTES ====="
find "$BASE/src/app" -path "*/hub/page.tsx" | sort
echo

echo "===== BUSCANDO ARCHIVO REAL DEL HUB ====="
TARGET="$BASE/src/app/(dashboard)/hub/page.tsx"
if [ ! -f "$TARGET" ]; then
  echo "ERROR: no existe $TARGET"
  exit 1
fi

sed -n '1,260p' "$TARGET"
echo

echo "===== REINICIANDO DEV ====="
cd "$BASE"
rm -rf .next
npm run dev
