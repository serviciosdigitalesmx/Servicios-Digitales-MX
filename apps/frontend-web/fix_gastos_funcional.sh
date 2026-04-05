#!/usr/bin/env bash
set -euo pipefail

FILE="./src/components/hub/ExpensesPanel.tsx"

echo "===== ACTIVANDO GASTOS ====="

# Asegurar import supabase
if ! grep -q 'supabase' "$FILE"; then
  sed -i '' '1s/^/"use client";\nimport { supabase } from "..\/..\/lib\/supabase";\n/' "$FILE"
fi

# Insertar estado modal después de useState
perl -0777 -i -pe 's/useState\(\[\]\);/useState([]);\n\n  const [open, setOpen] = useState(false);\n  const [form, setForm] = useState({ concepto:"", proveedor:"", monto:"", metodo:"Transferencia" });/' "$FILE"

# Reemplazar botón
sed -i '' 's/NUEVO GASTO/NUEVO GASTO" onClick={() => setOpen(true)}/' "$FILE"

echo "===== LISTO ====="

rm -rf .next
npm run dev
