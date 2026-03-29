# Supabase Setup Local

## Estado actual

El proyecto nuevo ya quedó preparado para recibir configuración local de Supabase en frontend y backend.

## Archivos locales esperados

### Frontend

Archivo:

- `apps/frontend-web/.env.local`

Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Backend

Archivo:

- `apps/backend-api/appsettings.Development.local.json`

Estructura:

```json
{
  "Supabase": {
    "Url": "https://TU-PROYECTO.supabase.co",
    "ServiceKey": "TU-SECRET-KEY"
  }
}
```

## Siguiente paso recomendado

1. Ejecutar la migración inicial en Supabase:
   - `infra/supabase/migrations/0001_initial.sql`
2. Reemplazar el store en memoria del backend por acceso real a Supabase
3. Conectar:
   - `customers`
   - `service_orders`
4. Después montar auth real
