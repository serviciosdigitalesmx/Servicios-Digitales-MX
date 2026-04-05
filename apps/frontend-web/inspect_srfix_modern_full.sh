#!/usr/bin/env bash
set -euo pipefail

REPO="$HOME/Desktop/SrFix-Modern"

if [ ! -d "$REPO" ]; then
  echo "NO_EXISTE_REPO: $REPO"
  echo "===== CONTENIDO DEL DESKTOP ====="
  ls -la "$HOME/Desktop"
  exit 1
fi

cd "$REPO"

echo "===== PWD ====="
pwd
echo

echo "===== ARCHIVOS RAIZ ====="
ls -la
echo

echo "===== ESTRUCTURA IMPORTANTE ====="
find . -maxdepth 4 \( \
  -name "package.json" -o \
  -name "tailwind.config.js" -o \
  -name "tailwind.config.ts" -o \
  -name "postcss.config.js" -o \
  -name "postcss.config.mjs" -o \
  -name "next.config.js" -o \
  -name "next.config.mjs" -o \
  -name "next.config.ts" -o \
  -name "vite.config.ts" -o \
  -name "vite.config.js" -o \
  -name "globals.css" -o \
  -name "*.css" -o \
  -name "*.tsx" -o \
  -name "*.jsx" -o \
  -name "*.html" \
\) | sort
echo

echo "===== PACKAGE JSONS ====="
find . -maxdepth 4 -name "package.json" | sort | while read -r f; do
  echo "----- FILE: $f -----"
  cat "$f"
  echo
done

echo "===== BUSQUEDA LOGIN / HUB / DASHBOARD ====="
grep -Rni . \
  --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" --include="*.css" --include="*.html" \
  -E "login|hub|dashboard|sidebar|top-bar|overlay|login-card|Acceso a Hub|Entrar al Sistema|SrFix|Sr Fix|Management Hub|sidebar|nav-item" || true
echo

echo "===== CSS IMPORTANTES ====="
find . -type f \( -name "*.css" -o -name "globals.css" \) | sort | while read -r f; do
  echo "----- FILE: $f -----"
  sed -n '1,260p' "$f"
  echo
done

echo "===== HTML/TSX IMPORTANTES ====="
find . -type f \( -name "*.html" -o -name "*Login*.tsx" -o -name "*Hub*.tsx" -o -name "*Dashboard*.tsx" -o -name "page.tsx" \) | sort | while read -r f; do
  echo "----- FILE: $f -----"
  sed -n '1,260p' "$f"
  echo
done
