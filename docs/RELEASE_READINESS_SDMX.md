# Release Readiness SDMX

## Objetivo

Checklist mínimo para no desplegar `Servicios-Digitales-MX` con ambigüedad de entorno.

## Frontend

### Runtime recomendado para validación de release

- usar Node 22 LTS para `next build`
- evitar validar release con Node `v25.8.1` en esta máquina

Motivo:

- bajo Node `v25.8.1` este workspace ha mostrado falsos negativos de entorno con Next 15
- con Node 22 LTS el build pasó limpio en Fase 5

### Producción

Debe existir:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_API_BASE_URL`

Regla:

- en producción, si `NEXT_PUBLIC_API_BASE_URL` falta, los proxies `api/payments/*` deben fallar explícitamente con `BACKEND_API_URL_NOT_CONFIGURED`

### Local

Si no existe `API_BASE_URL` del lado servidor:

- `backendApi.ts` usa `http://localhost:5111`

## Backend

### Supabase

Debe existir:

- `Supabase:Url`
- `Supabase:ServiceKey`

### Mercado Pago

Debe existir:

- `MercadoPago:AccessToken`
- `MercadoPago:BaseUrl`
- `MercadoPago:WebhookBaseUrl`

## Webhook

Target esperado:

- `{WebhookBaseUrl}/api/webhooks/mercadopago`

Verificación:

- `GET /api/health` debe exponer:
  - `billing.webhookBaseUrl`
  - `billing.webhookTarget`
  - `billing.webhookConfigured`

## Compatibilidad temporal

Mientras existan:

- `api/payments/plans`
- `api/payments/subscribe`
- `api/payments/webhook`

deben asumirse como:

- proxy temporal
- no arquitectura final

Ruta retirada:

- `api/payments/create`
  - ya no debe usarse
  - responde `410`
  - reemplazo: `api/payments/subscribe`

## Smoke mínimo antes de release

1. backend compile
2. frontend build con Node 22 LTS
3. `GET /api/health`
4. `GET /api/payments/plans`
5. `POST /api/payments/subscribe`
6. `POST /api/payments/create` -> `410`
7. `GET /login`
8. `GET /hub`
