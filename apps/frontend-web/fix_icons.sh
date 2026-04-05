#!/usr/bin/env bash
set -euo pipefail

FILE="./src/components/hub/TechnicalPanel.tsx"

echo "===== FIX ICONS ====="

# Reemplazar Screwdriver por Wrench
sed -i '' 's/Screwdriver/Wrench/g' "$FILE"

echo "===== LIMPIANDO ====="
rm -rf .next
npm run dev
