#!/usr/bin/env bash
set -euo pipefail

cd "$HOME/Servicios-Digitales-MX/apps/frontend-web"

echo "===== LOGIN PAGE FILES ====="
find ./src/app ./src/components -type f \( -path "*login*" -o -iname "*auth*" -o -iname "*public*" \) | sort
echo

echo "===== LOGIN PAGE CONTENT ====="
find ./src/app ./src/components -type f \( -path "*login*" -o -iname "*auth*" \) | sort | while read -r f; do
  echo "----- FILE: $f -----"
  sed -n '1,260p' "$f"
  echo
done

echo "===== PUBLIC CSS ====="
sed -n '1,260p' ./src/app/public-views.css
echo

echo "===== GLOBAL CSS ====="
sed -n '1,260p' ./src/app/globals.css
echo
