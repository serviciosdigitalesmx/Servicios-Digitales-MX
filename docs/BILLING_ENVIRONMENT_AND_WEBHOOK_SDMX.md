# Billing Environment And Webhook SDMX

## Objetivo

Dejar explícito cómo resuelve `Servicios-Digitales-MX` el billing en local y en producción, y por qué siguen existiendo las rutas `api/payments/*` en Next.

## Fuente de verdad actual

La fuente de verdad de billing es el backend .NET.

Endpoints reales:

- `GET /api/billing/plans`
- `POST /api/billing/checkout-preference`
- `POST /api/webhooks/mercadopago`

## Papel del frontend Next

Las rutas:

- `apps/frontend-web/src/app/api/payments/plans/route.ts`
- `apps/frontend-web/src/app/api/payments/subscribe/route.ts`
- `apps/frontend-web/src/app/api/payments/webhook/route.ts`

no son la fuente de verdad.

Hoy existen como:

- capa de compatibilidad temporal
- proxy delgado hacia backend .NET
- protección para no romper el frontend actual mientras se termina la migración

Ruta retirada:

- `apps/frontend-web/src/app/api/payments/create/route.ts`
  - quedó retirada en Fase 5
  - responde `410`
  - redirige contractualmente a `api/payments/subscribe`

Contrato activo para checkout:

- el frontend debe consumir `checkoutUrl` como salida principal
- `init_point` se conserva únicamente como compatibilidad residual en `api/payments/subscribe`

## Resolución de backend

El frontend usa `apps/frontend-web/src/lib/backendApi.ts`.

Resolución actual:

### Local / desarrollo

- si no existe `API_BASE_URL` del lado servidor
- y `NODE_ENV !== production`
- usa:
  - `http://localhost:5111`

### Producción

- usa `NEXT_PUBLIC_API_BASE_URL`
- si no existe, cae al fallback local

## Variables relevantes

### Frontend

Archivo local:

- `apps/frontend-web/.env.local`

Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_API_BASE_URL`

### Backend

Archivo local:

- `apps/backend-api/appsettings.Development.local.json`

Sección `MercadoPago`:

- `AccessToken`
- `PublicKey`
- `BaseUrl`
- `WebhookBaseUrl`
- `SupportPhone`

## Webhook de Mercado Pago

Mercado Pago debe apuntar al backend .NET, no al frontend como fuente de verdad.

Target esperado:

- `{WebhookBaseUrl}/api/webhooks/mercadopago`

Ejemplo actual de desarrollo:

- `https://...ngrok-free.dev/api/webhooks/mercadopago`

## Qué validar antes de producción

1. `NEXT_PUBLIC_API_BASE_URL` debe apuntar al backend desplegado correcto
2. `WebhookBaseUrl` debe apuntar al backend público correcto
3. el backend debe responder:
   - `GET /api/billing/plans`
   - `POST /api/billing/checkout-preference`
   - `POST /api/webhooks/mercadopago`
4. el frontend puede seguir usando `api/payments/*`, pero solo como proxy
5. no debe existir consumo nuevo de `api/payments/create`
6. cualquier nuevo consumo de checkout debe leer `checkoutUrl`

## Nota de entorno local

En esta máquina, correr `next build` y `next dev` al mismo tiempo sobre el mismo workspace puede corromper artefactos dentro de `.next` y provocar errores falsos de runtime (`MODULE_NOT_FOUND`, `500` en páginas sanas).

Práctica recomendada:

1. no correr `build` y `dev` en paralelo sobre el mismo `apps/frontend-web`
2. si aparece ese síntoma, reiniciar `dev` con `.next` limpio

## Cuándo retirar `api/payments/*`

Se pueden retirar cuando:

1. el frontend consuma directo el backend o tenga un BFF definitivo
2. no exista dependencia residual del contrato antiguo
3. el auditor valide que checkout, webhook y planes siguen sanos sin ese puente

## Nota de compatibilidad

Mientras existan `api/payments/plans`, `api/payments/subscribe` o `api/payments/webhook`, el sistema debe asumirse como:

- migración avanzada
- no limpieza final completa

No como arquitectura final permanente.

## Nota de runtime de build

Para este workspace local, la validación estable de `next build` quedó comprobada con:

- Node 22 LTS

Node `v25.8.1` sigue siendo deuda de entorno local y no debe tomarse como referencia para aprobar release.
