#!/usr/bin/env bash
set -euo pipefail

FILE="./src/components/hub/ReceptionForm.tsx"

echo "===== FIX USE CLIENT ====="

# Eliminar cualquier "use client" mal colocado
sed -i '' '/"use client";/d' "$FILE"

# Insertarlo en la línea 1
sed -i '' '1s/^/"use client";\n/' "$FILE"

echo "===== FIXED ====="

rm -rf .next
npm run dev
