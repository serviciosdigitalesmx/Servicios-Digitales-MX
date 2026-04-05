#!/usr/bin/env bash
set -euo pipefail

echo "===== CREANDO SUPABASE CLIENT ====="

mkdir -p ./src/lib

cat > ./src/lib/supabase.ts <<'TS'
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
TS

echo "===== FIX IMPORT RECEPCION ====="

FILE="./src/components/hub/ReceptionForm.tsx"

# Cambiar import alias a ruta relativa
sed -i '' 's|@/lib/supabase|../../lib/supabase|g' "$FILE"

echo "===== LIMPIANDO CACHE ====="

rm -rf .next
npm run dev

echo "===== DONE ====="
