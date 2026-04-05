#!/usr/bin/env bash
set -euo pipefail

FILE="./src/components/hub/ReceptionForm.tsx"

echo "===== PATCH RECEPCION SUPABASE ====="

# 1. Asegurar import supabase
if ! grep -q 'from "@/lib/supabase"' "$FILE"; then
  sed -i '' '1s/^/import { supabase } from "@\/lib\/supabase";\n/' "$FILE"
fi

# 2. Reemplazar handleSubmit completo
perl -0777 -i -pe 's/const handleSubmit = async \(\) => \{.*?\};/const handleSubmit = async () => {\n  setLoading(true);\n\n  const folioGenerado = "SR-" + Math.floor(Math.random() * 90000 + 10000);\n\n  const { error } = await supabase.from("ordenes").insert([\n    {\n      folio: folioGenerado,\n      cliente_nombre: formData.clienteNombre,\n      cliente_telefono: formData.clienteTelefono,\n      equipo_tipo: formData.equipoTipo,\n      equipo_modelo: formData.equipoModelo,\n      falla: formData.equipoFalla,\n      fecha_promesa: formData.fechaPromesa,\n      costo: Number(formData.costo || 0),\n    },\n  ]);\n\n  if (error) {\n    console.error(error);\n    alert("Error guardando");\n    setLoading(false);\n    return;\n  }\n\n  setFolio(folioGenerado);\n  setSuccess(true);\n  setLoading(false);\n};/s' "$FILE"

echo "===== OK ====="

rm -rf .next
npm run dev
