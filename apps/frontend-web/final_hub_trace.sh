#!/usr/bin/env bash
set -euo pipefail

BASE="$HOME/Servicios-Digitales-MX/apps/frontend-web"
cd "$BASE"

echo "===== TODAS LAS PAGE.TSX ====="
find ./src/app -name "page.tsx" | sort
echo

echo "===== BUSQUEDA DE TEXTO DEL LOGIN VIEJO ====="
grep -Rni ./src/app ./src/components \
  --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" \
  -E "Bienvenido de nuevo|Acceso seguro al ecosistema|Entrar al Panel|Volver al inicio|Failed to fetch" || true
echo

echo "===== BUSQUEDA DE TEXTO DEL HUB MODERNO ====="
grep -Rni ./src/app ./src/components \
  --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" \
  -E "Dashboard Principal|Archivo Histórico|Gastos & Pagos|SrFixHub|SrFix\\<span|Operaciones Recientes" || true
echo

echo "===== HUB REAL ====="
sed -n '1,220p' "./src/app/(dashboard)/hub/page.tsx"
echo

echo "===== LIMPIEZA TOTAL ====="
rm -rf .next
find . -name ".DS_Store" -delete || true
echo "OK"
echo

echo "===== LEVANTANDO DEV ====="
npm run dev
