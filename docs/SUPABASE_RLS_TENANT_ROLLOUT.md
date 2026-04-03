# Supabase RLS Tenant Rollout

## Objetivo

Preparar el siguiente bloque de tenant isolation para tablas operativas sin romper produccion ni los modulos que todavia dependen de acceso amplio via backend/service role.

Tablas prioritarias de este bloque:

- `customers`
- `service_orders`
- `service_requests`
- `tasks`
- `file_assets`

## Estado encontrado

- El esquema ya es multi-tenant a nivel de columnas y llaves foraneas por `tenant_id`.
- No existia RLS habilitado en las tablas operativas.
- No existia una vista de auditoria para medir inconsistencias de tenant entre relaciones.
- `file_assets` no tenia indice explicito por `tenant_id`, lo que iba a penalizar futuras policies.

## Cambios incluidos en Fase 1

Migraciones:

- `supabase/migrations/202604030001_rls_tenant_isolation_phase1.sql`
- `infra/supabase/migrations/0007_rls_tenant_isolation_phase1.sql`

La fase 1 agrega:

- helper `public.current_tenant_id()` para leer contexto desde `app.current_tenant_id` o JWT claims
- helper `public.is_service_role()` para conservar bypass en llamadas operativas controladas
- helper `public.can_access_tenant(uuid)` para reutilizar en policies
- helper privado `private.try_parse_uuid(text)` para evitar fallos por claims malformados
- llaves foraneas compuestas `NOT VALID` sobre relaciones operativas para poder auditar antes de endurecer
- policies pre-creadas para las tablas prioritarias, pero sin habilitar `ROW LEVEL SECURITY`
- vista `public.tenant_isolation_operational_audit`
- indice `file_assets_tenant_created_at_idx`

## Por que no se habilita RLS todavia

Esta fase no activa `ENABLE ROW LEVEL SECURITY` porque todavia hay modulos no migrados y consumo via backend/service role que podria romperse si se endurece antes de:

- propagar contexto de tenant en todas las llamadas
- validar data historica
- decidir que rutas siguen usando `service_role`
- cubrir storage y URLs firmadas para `file_assets`

## Rollout recomendado por fases

### Fase 1. Preparacion

Aplicar la migracion nueva en el entorno objetivo.

Objetivo:

- dejar helpers, foreign keys compuestas y auditoria listas
- no cambiar comportamiento runtime

### Fase 2. Auditoria de datos y validacion gradual

Ejecutar:

```sql
select *
from public.tenant_isolation_operational_audit
order by table_name, check_name;
```

Cuando una tabla marque `ready_for_validation = true`, validar constraints puntuales:

```sql
alter table public.service_requests validate constraint service_requests_branch_tenant_fk;
alter table public.service_orders validate constraint service_orders_branch_tenant_fk;
alter table public.service_orders validate constraint service_orders_customer_tenant_fk;
alter table public.service_orders validate constraint service_orders_request_tenant_fk;
alter table public.tasks validate constraint tasks_branch_tenant_fk;
alter table public.tasks validate constraint tasks_service_order_tenant_fk;
alter table public.tasks validate constraint tasks_service_request_tenant_fk;
alter table public.file_assets validate constraint file_assets_branch_tenant_fk;
alter table public.file_assets validate constraint file_assets_service_order_tenant_fk;
alter table public.file_assets validate constraint file_assets_service_request_tenant_fk;
```

### Fase 3. Endurecimiento controlado

Solo despues de validar data y propagar tenant context:

1. `customers`
2. `service_requests`
3. `service_orders`
4. `tasks`
5. `file_assets`

Orden sugerido:

- `customers` puede endurecerse primero porque no depende de otras tablas operativas.
- `service_requests` puede seguir si `branch_id` ya es consistente.
- `service_orders` depende de `customers` y `service_requests`.
- `tasks` depende de `service_orders` y `service_requests`.
- `file_assets` debe endurecerse al final por el acoplamiento con storage, firmados y modulos externos.

## Matriz de endurecimiento

| Tabla | Estado actual | Puede endurecerse ya | Bloqueadores |
| --- | --- | --- | --- |
| `customers` | Preparada | Parcialmente si backend ya manda tenant context | Confirmar consumo real por backend y paneles |
| `service_requests` | Preparada con check de sucursal | No todavia | Validar datos historicos y contexto de tenant |
| `service_orders` | Preparada con checks relacionales | No todavia | Depende de `customers` y `service_requests` |
| `tasks` | Preparada con checks relacionales | No todavia | Depende de rutas y workers operativos |
| `file_assets` | Preparada con checks e indice | No todavia | Falta estrategia final de storage y signed URLs |

## Integracion esperada en backend

Antes de activar RLS real, la integracion debe poder fijar uno de estos contextos por request:

- `set local app.current_tenant_id = '<uuid>'`
- claim JWT `tenant_id`
- claim JWT `shop_id`
- `app_metadata.tenant_id`
- `app_metadata.shop_id`

Si un flujo necesita seguir con bypass administrativo, debe quedar claramente encapsulado usando `service_role`.

## Riesgos abiertos

- No se ha auditado data real del entorno productivo desde este workspace.
- `file_assets` requiere cierre conjunto con storage policies.
- Si el backend no propaga tenant context antes de activar RLS, habra regresiones inmediatas.

## Estado real del repo al 2026-04-03

Tras la migracion coordinada de frontend/backend ya no dependen del cliente publico para sus operaciones criticas estos frentes:

- `customers`
- `service_requests`
- `service_orders`
- `tasks`
- `file_assets` para el flujo de expediente actual

Esto cambia el mapa de riesgo: el principal bloqueo para endurecer RLS ya no esta en esos modulos nucleares, sino en modulos que todavia hacen lecturas/escrituras directas con Supabase desde frontend, por ejemplo:

- `suppliers`
- `products`
- `expenses`
- `purchase_orders`
- `purchase_order_items`
- `branches`
- dashboards/reportes financieros que siguen leyendo tablas operativas directo

## Lectura actualizada de endurecimiento

### Tablas mas cerca de endurecerse

- `customers`
  - ya consume backend autenticado para alta/listado/detalle/update
- `service_requests`
  - ya consume backend autenticado para listado/alta
- `service_orders`
  - ya consume backend autenticado en operativo, tecnico y archivo
- `tasks`
  - ya consume backend autenticado para listado/alta/update

### Tabla que debe seguir al final

- `file_assets`
  - aunque el flujo ya vive en backend/storage, sigue dependiendo del cierre completo de policies de storage y la estrategia final de acceso a objetos

### Bloqueadores reales restantes antes de enforcement duro

1. auditar datos historicos con `tenant_isolation_operational_audit`
2. validar constraints `NOT VALID` por tabla
3. confirmar que el backend fija tenant context por request de forma compatible con las helpers del rollout
4. migrar o encapsular por backend los modulos que aun leen/escriben:
   - `suppliers`
   - `products`
   - `expenses`
   - `purchase_orders`
   - `branches`
5. cerrar estrategia final de `storage.objects` / signed URLs para `file_assets`

## Recomendacion actualizada de rollout

Si la auditoria de datos sale limpia, el orden sugerido ya puede ser:

1. `customers`
2. `service_requests`
3. `service_orders`
4. `tasks`
5. `file_assets`

Pero solo despues de completar el desacople pendiente de los modulos administrativos/comerciales que siguen usando Supabase directo.

## Actualizacion del barrido del dashboard interno

Tras la pasada global mas reciente sobre `apps/frontend-web/src/components/ui`, el dashboard interno quedo mucho mas limpio de acceso directo a tablas sensibles.

Frentes ya migrados o sustancialmente desacoplados a backend:

- `ClientesNative`
- `TareasNative`
- `ArchivoNative`
- `OperativoNative`
- `TecnicoNative`
- `SolicitudesNative`
- `ProveedoresNative`
- `StockNative`
- `ComprasNative`
- `GastosNative`
- `FinanzasNative`
- `ReportesNative`
- `SucursalesNative`
- carga de sucursales en `ProductDashboard`

Esto reduce mucho el riesgo para el siguiente bloque de endurecimiento, porque la mayor parte del dashboard interno ya consume:

- `fetchWithAuth(...)`
- rutas `/api/...`
- backend como capa de negocio

## Lectura operativa actualizada

Si la auditoria de datos sale bien, el principal trabajo previo a enforcement duro ya no esta en los modulos internos nucleares, sino en:

- residuos secundarios fuera del dashboard interno
- validacion integrada
- propagacion formal de tenant context compatible con las helpers del rollout
- cierre final de `file_assets`/storage

## Matriz final de readiness al 2026-04-03

| Tabla | Estado de consumo app | Estado de preparacion RLS | Ready para siguiente fase | Falta antes de enforcement |
| --- | --- | --- | --- | --- |
| `customers` | Backend autenticado para list/detail/create/update | Documentado, pero migracion RLS no esta en repo | Casi lista | agregar migracion real de RLS/tenant helpers al repo, auditar datos, propagar tenant context |
| `service_requests` | Backend autenticado para list/create | Documentado, pero migracion RLS no esta en repo | Casi lista | migracion real + auditoria + validar branch/tenant consistency |
| `service_orders` | Backend autenticado en operativo, tecnico y archivo | Documentado, pero migracion RLS no esta en repo | Casi lista | migracion real + auditoria + validar relaciones con customers/service_requests |
| `tasks` | Backend autenticado para list/create/update | Documentado, pero migracion RLS no esta en repo | Casi lista | migracion real + auditoria + validar relaciones con orders/requests |
| `file_assets` | Backend autenticado para flujo actual de expediente | Storage foundation aplicada; rollout RLS documentado, no presente en repo | Parcial | cerrar `storage.objects`/signed URLs + migracion real de tenant isolation + auditoria |

## Hallazgo importante sobre el estado del repo

El documento del rollout y la bitácora del Bot 3 mencionan migraciones de tenant isolation:

- `supabase/migrations/202604030001_rls_tenant_isolation_phase1.sql`
- `infra/supabase/migrations/0007_rls_tenant_isolation_phase1.sql`

Pero esas migraciones **no existen actualmente en este repo**.

Eso significa que, al dia de hoy:

- el **plan** de RLS/tenant isolation ya esta documentado
- el **desacople de consumo** del dashboard interno ya avanzo mucho
- pero la **foundation SQL real** de tenant isolation todavia no esta materializada en migraciones del repo

## Decision operativa correcta

Antes de prender enforcement progresivo, el siguiente paso obligatorio ya no es solo “activar RLS”.
El siguiente paso correcto es:

1. recrear en el repo las migraciones reales de tenant isolation fase 1
2. aplicar esas migraciones en staging/produccion
3. correr la auditoria de datos
4. validar constraints
5. encender enforcement por tabla
