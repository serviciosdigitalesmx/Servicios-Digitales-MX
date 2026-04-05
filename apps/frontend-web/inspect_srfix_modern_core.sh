#!/usr/bin/env bash
set -euo pipefail

REPO="$HOME/Desktop/SrFix-Modern"
cd "$REPO"

for f in \
  "./src/app/layout.tsx" \
  "./src/app/page.tsx" \
  "./src/app/globals.css" \
  "./src/components/Sidebar.tsx" \
  "./src/components/Dashboard.tsx" \
  "./src/components/ReceptionForm.tsx" \
  "./src/components/TechnicalPanel.tsx" \
  "./src/components/ArchivePanel.tsx" \
  "./src/components/CustomersPanel.tsx" \
  "./src/components/FinancePanel.tsx"
do
  if [ -f "$f" ]; then
    echo "===== FILE: $f ====="
    sed -n '1,320p' "$f"
    echo
  else
    echo "===== NO EXISTE: $f ====="
    echo
  fi
done
