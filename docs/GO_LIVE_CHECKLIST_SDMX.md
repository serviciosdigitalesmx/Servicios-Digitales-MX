# Go Live Checklist SDMX

## Objetivo

Checklist corto y ejecutable para salir a producción sin saltarnos pasos críticos.

## Antes del deploy

- [ ] Correr `npm run deploy:preflight`
- [ ] Confirmar Node 22 LTS para el frontend
- [ ] Confirmar .NET 10 para backend
- [ ] Confirmar variables de Vercel cargadas
- [ ] Confirmar variables de Render cargadas
- [ ] Confirmar `MercadoPago__WebhookBaseUrl` con URL pública real
- [ ] Confirmar `NEXT_PUBLIC_API_BASE_URL` apuntando al backend real

## Backend

- [ ] Deploy realizado en Render
- [ ] `GET /api/health` responde `200`
- [ ] `billing.webhookConfigured` responde `true`
- [ ] `GET /api/billing/plans` responde `200`

## Frontend

- [ ] Deploy realizado en Vercel
- [ ] `/login` carga
- [ ] `/hub` carga
- [ ] `GET /api/payments/plans` responde `200`
- [ ] `POST /api/payments/subscribe` responde `200` con `checkoutUrl`
- [ ] `POST /api/payments/create` responde `410`

## Mercado Pago

- [ ] Webhook configurado a `{backend}/api/webhooks/mercadopago`
- [ ] Checkout sandbox abre correctamente
- [ ] Pago de prueba llega al backend
- [ ] El backend refleja el cambio esperado en Supabase

## Smoke final

- [ ] Correr `npm run go-live:smoke`
- [ ] Guardar salida del smoke en la bitácora del release

## No salir si

- [ ] hay mezcla de URLs locales y productivas
- [ ] `next build` se validó con Node distinto a 22 LTS
- [ ] falta confirmar webhook productivo
- [ ] el smoke falla en cualquiera de sus endpoints
