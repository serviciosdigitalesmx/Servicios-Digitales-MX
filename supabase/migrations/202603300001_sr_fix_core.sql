-- Migration: Sr-Fix Core Enhancements
-- Adds specific fields from Sr-Fix hardening to the SDMX SaaS schema

-- 1. IP Auditing for Service Requests
alter table public.service_requests
add column if not exists solicitud_origen_ip text;

-- 2. Technical Resolution and Inactivity tracking for Service Orders
alter table public.service_orders
add column if not exists caso_resolucion_tecnica text;

-- Note: updated_at already exists in service_orders and is updated by trigger trg_service_orders_updated_at.
-- This will be used for the 48h inactivity dashboard highlighting.

-- 3. Additional search indices for common Sr-Fix operations
create index if not exists service_orders_tenant_folio_idx on public.service_orders (tenant_id, folio);
create index if not exists service_requests_tenant_folio_idx on public.service_requests (tenant_id, folio);

-- 4. Ensure RLS policies are at least initialized for these tables
-- (Assuming they were enabled in initial.sql, we just verify or add specific ones if needed)

comment on column public.service_requests.solicitud_origen_ip is 'IP pública capturada lors de la solicitud original (Hardening Tarea 1.1)';
comment on column public.service_orders.caso_resolucion_tecnica is 'Resolución final detallada del caso por parte del técnico (Hardening Tarea 2.3)';
