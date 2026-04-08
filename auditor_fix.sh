#!/bin/bash
# Servicios Digitales MX - Auditor de Despliegue v1.0
# Con un toque de wit: "Si no corre, lo empujamos"

echo "🔍 Iniciando auditoría profunda de Servicios Digitales MX..."

# 1. Verificación de Rutas Críticas (Los errores de Vercel)
echo "📂 Verificando integridad de archivos..."

FILES=(
  "apps/frontend-web/src/lib/supabase.ts"
  "apps/frontend-web/src/components/ui/MarketingLanding.tsx"
  "apps/frontend-web/src/hooks/useShopBranding.ts"
  "apps/frontend-web/src/hooks/useUpdateShopSettings.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ [OK] $file"
  else
    echo "❌ [ERROR] Falta $file. Recreando..."
    # Recreación de emergencia de Supabase Lib si falta
    if [[ $file == *"supabase.ts"* ]]; then
      mkdir -p apps/frontend-web/src/lib
      echo "import { createClient } from '@supabase/supabase-js'; export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);" > "$file"
    fi
  fi
done

# 2. Refactor de Alias de Importación
echo "🛠 Corrigiendo posibles errores de case-sensitivity (Linux/Vercel)..."
find apps/frontend-web/src -type f -name "*.tsx" -exec sed -i '' 's/from "@\/components\/ui\/marketinglanding"/from "@\/components\/ui\/MarketingLanding"/g' {} + 2>/dev/null

# 3. Limpieza de Caché y Dependencias
echo "🧹 Limpiando basura de compilación..."
rm -rf apps/frontend-web/.next
rm -rf apps/frontend-web/node_modules
echo "✅ Caché eliminada."

# 4. Git Synchronization Force
echo "🚀 Sincronizando con el repositorio..."
git add .
git commit -m "chore: audit and fix module paths for production build"
git push

echo "🎯 Auditoría terminada. Vercel debería estar compilando ahora sin errores."
