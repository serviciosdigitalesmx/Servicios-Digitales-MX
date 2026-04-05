#!/usr/bin/env bash
set -euo pipefail

REPO="$HOME/Sr-Fix"

if [ ! -d "$REPO" ]; then
  echo "NO_EXISTE_REPO: $REPO"
  exit 1
fi

cd "$REPO"

echo "===== PWD ====="
pwd
echo

echo "===== ESTRUCTURA BASE ====="
find . -maxdepth 3 \( \
  -name "package.json" -o \
  -name "tailwind.config.js" -o \
  -name "tailwind.config.ts" -o \
  -name "postcss.config.js" -o \
  -name "postcss.config.mjs" -o \
  -name "globals.css" -o \
  -name "*.module.css" -o \
  -name "*.css" -o \
  -name "page.tsx" -o \
  -name "layout.tsx" \
\) | sort
echo

echo "===== BUSQUEDA LOGIN / AUTH / SRFIX ====="
grep -Rni . \
  --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" --include="*.css" \
  -E "login|iniciar sesión|inicia sesión|auth|SR\\. FIX|SR FIX|Microchip|Contraseña|Correo Electrónico|Acceso seguro" || true
echo

echo "===== CSS IMPORTANTES ====="
find . -type f \( -name "globals.css" -o -name "*.css" -o -name "*.module.css" \) | sort | while read -r f; do
  echo "----- FILE: $f -----"
  sed -n '1,260p' "$f"
  echo
done

echo "===== COMPONENTES IMPORTANTES ====="
find . -type f \( -name "*Login*.tsx" -o -name "*Auth*.tsx" -o -name "*Icons*.tsx" -o -name "page.tsx" \) | sort | while read -r f; do
  echo "----- FILE: $f -----"
  sed -n '1,260p' "$f"
  echo
done
