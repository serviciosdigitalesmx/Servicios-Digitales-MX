# Servicios Digitales MX

Monorepo inicial del nuevo sistema SaaS `Servicios Digitales MX`.

## Estructura

- `apps/frontend-web`: frontend web en Next.js
- `apps/backend-api`: backend en ASP.NET Core
- `infra/supabase`: migraciones, seed y políticas
- `docs`: contratos, roadmap, backlog y diseño técnico
- `packages/shared-types`: contratos compartidos
- `packages/shared-constants`: constantes compartidas

## Estado actual

Base documental y estructura inicial creadas.

## Estado de migración actual

- Fase 1: auth/dashboard validado
- Fase 2: billing converge a backend .NET como fuente de verdad
- Fase 3: endurecimiento de entorno y compatibilidad temporal validado
- Fase 4: release readiness / hardening de entorno validado
- Fase 5: cleanup de compatibilidad residual de billing validado
- Fase 6: release operativo y smoke reutilizable validado
- Fase 7: despliegue real guiado validado
- Fase 8: preflight de deploy y go-live smoke auditables validados

## Billing hoy

- El backend .NET es la fuente de verdad para:
  - planes
  - checkout
  - webhook de Mercado Pago
- El frontend Next mantiene solo estas rutas como compatibilidad temporal y proxy:
  - `api/payments/plans`
  - `api/payments/subscribe`
  - `api/payments/webhook`
- `api/payments/create` ya fue retirada y responde `410` con reemplazo explícito hacia `api/payments/subscribe`.

Documento de referencia:

- `docs/BILLING_ENVIRONMENT_AND_WEBHOOK_SDMX.md`
- `docs/RELEASE_READINESS_SDMX.md`
- `docs/DEPLOY_RUNBOOK_SDMX.md`
- `docs/GO_LIVE_CHECKLIST_SDMX.md`

Helpers operativos:

- `npm run deploy:preflight`
- `npm run release:smoke`
- `npm run go-live:smoke`

## Siguiente paso recomendado

- usar:
  - `render.yaml`
  - `apps/frontend-web/vercel.json`
  - `docs/GO_LIVE_CHECKLIST_SDMX.md`
  - `npm run deploy:preflight`
  - `npm run go-live:smoke`
- decidir si el siguiente frente será:
  - deploy productivo real
  - o retiro completo de proxies Next para billing
