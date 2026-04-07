#!/bin/bash
echo "🛠️ Aplicando parches críticos..."

# 1. FIX BACKEND (Seguridad)
BE_PROG="apps/backend-api/Program.cs"
BE_SERV="apps/backend-api/src/Infrastructure/SupabaseService.cs"

if [ -f "$BE_PROG" ]; then
    sed -i '' 's/await supabaseService.EnsureBootstrapDataAsync();//g' "$BE_PROG"
    sed -i '' 's/await _supabase.Auth.Update(new UserAttributes { Password = "Admin123!" });/\/\/ Password reset disabled for security/g' "$BE_SERV"
    echo "✅ Seguridad de Backend: Blindada."
else
    echo "❌ Error: No se encontró el backend. Revisa que estés en la raíz del repo."
fi

# 2. FIX FRONTEND (Mobile + Branding)
FE_HUB="apps/frontend-web/src/app/(dashboard)/hub/page.tsx"

if [ -f "$FE_HUB" ]; then
    # Limpieza de branding y roles
    sed -i '' 's/SRFIX INT/SDMX HUB/g' "$FE_HUB"
    sed -i '' 's/Internal Suite/Gestión Digital/g' "$FE_HUB"
    sed -i '' 's/Root Admin/{session?.user?.Role || "Usuario"}/g' "$FE_HUB"

    # Inyectar Navegación Móvil (Fix de la barra inferior)
    python3 -c "
import sys
path = '$FE_HUB'
with open(path, 'r') as f: lines = f.readlines()
nav_code = \"\"\"
      {/* Mobile Nav Bar */}
      <div className='md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 z-50'>
        {modules.map((m) => (
          <button 
            key={m.id} 
            onClick={() => setActiveModule(m.id)}
            className={'p-2 ' + (activeModule === m.id ? 'text-blue-600' : 'text-gray-500')}
          >
            <m.icon className='w-6 h-6' />
          </button>
        ))}
      </div>
\"\"\"
for i in range(len(lines)-1, 0, -1):
    if '</main>' in lines[i]:
        lines.insert(i, nav_code)
        break
with open(path, 'w') as f: f.writelines(lines)
"
    echo "✅ Frontend: Navegación móvil y branding restaurados."
else
    echo "❌ Error: No se encontró el archivo del Hub."
fi
