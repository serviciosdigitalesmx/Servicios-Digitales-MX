# Decisión Arquitectónica: Shops y Subscriptions

## 1. Contexto

`Servicios Digitales MX` nace como un SaaS multi-tenant para talleres y negocios de reparación en México.

La instrucción de producto es clara:

- cada local es una unidad sagrada de operación
- ningún dato puede cruzarse entre locales
- el sistema debe estar listo para cobro recurrente mensual
- el stack oficial es `Next.js + .NET 10 + Supabase`

## 2. Decisión

Se adopta el término de negocio `Shop` como unidad principal de aislamiento.

Definición:

- un `Shop` representa un negocio cliente del SaaS
- un `Shop` puede tener una o varias sucursales
- toda operación funcional depende del `Shop` activo

Compatibilidad técnica:

- el esquema actual ya desplegado en Supabase usa `tenants` y `tenant_id`
- por estabilidad, `tenant_id` se mantiene como nombre físico temporal
- desde este momento, `shop_id` y `tenant_id` deben considerarse equivalentes en la capa de negocio

## 3. Regla de Aislamiento

Todo dato operativo debe quedar filtrado por `Shop`.

Esto incluye como mínimo:

- usuarios
- sucursales
- clientes
- solicitudes
- órdenes de servicio
- tareas
- inventario
- compras
- gastos
- archivos

Ninguna consulta del backend puede omitir el filtro de `Shop`.

## 4. Decisión de Suscripciones

Se adopta un dominio explícito de `Subscriptions`.

Objetivo:

- controlar acceso comercial al SaaS
- soportar cobro recurrente mensual
- reflejar estados como `active`, `trialing`, `past_due`, `suspended`, `cancelled`

Regla operativa:

- cada `Shop` debe tener una suscripción asociada o un estado comercial resoluble
- el backend debe poder bloquear acceso a rutas operativas cuando el `Shop` no tenga estado habilitado

Precio inicial de referencia:

- `350 MXN` mensuales

## 5. Implicaciones Técnicas

### 5.1 Base de datos

Se agregará una tabla `subscriptions` ligada a `tenants(id)`.

Campos mínimos esperados:

- `id`
- `tenant_id`
- `plan_code`
- `plan_name`
- `price_mxn`
- `billing_interval`
- `status`
- `current_period_start`
- `current_period_end`
- `grace_until`
- `external_provider`
- `external_subscription_id`
- `cancel_at_period_end`
- `created_at`
- `updated_at`

### 5.2 Backend

El backend en `.NET 10` debe:

- resolver el `Shop` activo por request
- validar la suscripción del `Shop`
- negar acceso a módulos críticos si la suscripción está suspendida o cancelada

### 5.3 Frontend

El frontend en `Next.js` debe:

- operar siempre dentro del contexto del `Shop`
- mostrar estado comercial del `Shop` cuando corresponda
- poder reaccionar a estados de bloqueo o cobranza vencida

## 6. Decisión de Nomenclatura

Lenguaje de negocio oficial:

- `Shop`
- `Subscription`
- `Branch`
- `Service Order`

Lenguaje técnico de compatibilidad actual:

- `tenant`
- `tenant_id`

Regla:

- documentación funcional y de producto debe hablar de `Shop`
- código nuevo puede seguir usando `tenant_id` de manera temporal si eso evita romper el sistema ya desplegado
- toda nueva capa de servicios debe documentar explícitamente esta equivalencia

## 7. Consecuencia para el Sprint 1

El Sprint 1 ya no debe verse solo como un backend demo.

Debe dejar resuelto:

- aislamiento por `Shop`
- bootstrap de `Shop` inicial
- base para control de suscripción
- contratos listos para endurecer autenticación y autorización

## 8. Estado

Decisión aceptada.
