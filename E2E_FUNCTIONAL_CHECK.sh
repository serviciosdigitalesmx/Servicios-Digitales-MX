#!/bin/bash

# === SR FIX: PROTOCOLO DE PRUEBA FUNCIONAL END-TO-END ===
# Este script valida que los flujos críticos estén vivos y comunicados.

echo "--- PASO 0: VERIFICACIÓN DE ENTORNOS ---"
echo "Revisando Backend (.NET)..."
cd apps/backend-api && dotnet build --no-restore > /dev/null && echo "✅ Backend Compila" || echo "❌ Backend Roto"
cd ../..

echo -e "\nRevisando Frontend (Next.js)..."
[ -d "apps/frontend-web/.next" ] && echo "✅ Frontend Build Existente" || echo "⚠️ Requiere npm run build"

echo -e "\n--- PASO 1: FLUJO DE ACCESO (AUTH) ---"
echo "1.1 Intenta login con credenciales reales en http://localhost:3000/login"
echo "1.2 Verifica que el AuthGuard te deje pasar al /hub"
echo "1.3 Valida que tu nombre real aparezca en la esquina inferior del Sidebar."

echo -e "\n--- PASO 2: PRUEBA DE PORTAL PÚBLICO (NUEVO ENDPOINT) ---"
echo "2.1 Abre en tu navegador: http://localhost:3000/portal?s=demo"
echo "2.2 ¿Se ve el nombre de la tienda? (Si sí, el nuevo endpoint de C# está funcionando)."

echo -e "\n--- PASO 3: FLUJO OPERATIVO (TÉCNICO) ---"
echo "3.1 Entra al Hub -> Sección Taller Técnico."
echo "3.2 Deberías ver la lista de órdenes reales de Supabase."
echo "3.3 Selecciona un equipo, cambia el estatus a 'En Reparación' y dale Guardar."
echo "3.4 Refresca: Si el cambio persiste, la conexión PATCH al backend es exitosa."

echo -e "\n--- PASO 4: SEGURIDAD DE PAGOS (WEBHOOK) ---"
echo "4.1 Intenta enviar un POST manual al webhook sin firma:"
echo "    curl -X POST http://localhost:5111/api/webhooks/mercadopago -d '{\"id\":123}'"
echo "4.2 RESULTADO ESPERADO: 401 Unauthorized (Porque no lleva x-signature)."

echo -e "\n--- PASO 5: RESPONSIVIDAD ---"
echo "5.1 En el /hub, reduce el ancho del navegador al tamaño de un celular."
echo "5.2 Verifica que el Sidebar desaparezca y aparezca el botón de 'Hamburguesa'."

echo -e "\n======================================================="
echo "Si todo lo anterior pasa, tu sistema está listo para PROD."
echo "======================================================="
