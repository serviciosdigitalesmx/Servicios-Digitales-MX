# Deploy Runbook SDMX

## Objetivo

Dejar un camino operativo claro para desplegar `Servicios-Digitales-MX` con:

- frontend en Vercel
- backend en Render
- Supabase como fuente de datos
- Mercado Pago apuntando al backend .NET

## Runtime recomendado

### Frontend

- Node 22 LTS

Motivo:

- en este workspace local, Next 15 validó build de forma estable con Node 22 LTS
- Node `v25.8.1` produjo falsos negativos de entorno

### Backend

- .NET 10

## Archivos de plataforma

### Render

- `/Users/jesusvilla/Desktop/clonando y mejorando sr fix/servicios-digitales-mx/render.yaml`

### Vercel

- `/Users/jesusvilla/Desktop/clonando y mejorando sr fix/servicios-digitales-mx/apps/frontend-web/vercel.json`

### Docker backend

- `/Users/jesusvilla/Desktop/clonando y mejorando sr fix/servicios-digitales-mx/apps/backend-api/Dockerfile`
- `/Users/jesusvilla/Desktop/clonando y mejorando sr fix/servicios-digitales-mx/apps/backend-api/.dockerignore`

## Variables por plataforma

### Vercel

Tomar como base:

- `/Users/jesusvilla/Desktop/clonando y mejorando sr fix/servicios-digitales-mx/apps/frontend-web/.env.example`

Variables mínimas:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_API_BASE_URL`

### Render

Tomar como base:

- `/Users/jesusvilla/Desktop/clonando y mejorando sr fix/servicios-digitales-mx/apps/backend-api/appsettings.Production.example.json`

Variables mínimas:

- `Supabase__Url`
- `Supabase__ServiceKey`
- `MercadoPago__AccessToken`
- `MercadoPago__PublicKey`
- `MercadoPago__BaseUrl`
- `MercadoPago__WebhookBaseUrl`
- `MercadoPago__SupportPhone`

## Orden correcto de salida

1. configurar variables de Render
2. desplegar backend .NET
3. validar:
   - `GET /api/health`
   - `GET /api/billing/plans`
4. configurar variables de Vercel apuntando al backend real
5. desplegar frontend
6. validar:
   - `/login`
   - `/hub`
   - `/api/payments/plans`
   - `/api/payments/subscribe`
7. configurar webhook de Mercado Pago apuntando al backend:
   - `{backend}/api/webhooks/mercadopago`
8. correr checklist final:
   - `docs/GO_LIVE_CHECKLIST_SDMX.md`

## Smoke operativo

Se puede correr:

```bash
cd "/Users/jesusvilla/Desktop/clonando y mejorando sr fix/servicios-digitales-mx"
FRONTEND_URL="https://tu-frontend.vercel.app" \
BACKEND_URL="https://tu-backend.onrender.com" \
npm run release:smoke
```

Preflight de deploy:

```bash
cd "/Users/jesusvilla/Desktop/clonando y mejorando sr fix/servicios-digitales-mx"
npm run deploy:preflight
```

Smoke con log guardado:

```bash
cd "/Users/jesusvilla/Desktop/clonando y mejorando sr fix/servicios-digitales-mx"
FRONTEND_URL="https://tu-frontend.vercel.app" \
BACKEND_URL="https://tu-backend.onrender.com" \
npm run go-live:smoke
```

Si quieres validar checkout real:

```bash
SUBSCRIBE_PAYLOAD='{"planCode":"profesional-650","tenantId":"UUID","email":"correo@dominio.com","fullName":"Nombre"}' \
FRONTEND_URL="https://tu-frontend.vercel.app" \
BACKEND_URL="https://tu-backend.onrender.com" \
npm run release:smoke
```

## Criterios de pase

- backend responde `200` en `/api/health`
- frontend responde `200` en `/api/payments/plans`
- subscribe responde `200` con `checkoutUrl`
- create responde `410`
- login y hub cargan
- existe un log del smoke en `artifacts/`

## Notas de deuda viva

- `plans`, `subscribe` y `webhook` siguen como compatibilidad temporal en Next
- `create` ya está retirada
- no correr `next build` y `next dev` en paralelo sobre el mismo workspace local
