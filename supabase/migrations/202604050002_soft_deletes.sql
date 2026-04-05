-- Servicios Digitales MX
-- Implementación de Borrado Lógico (Soft Deletes)
-- Agregamos la columna deleted_at a las tablas principales para integridad histórica.

-- 1. Agregar columna deleted_at a tablas clave
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 2. Integración con RLS para ocultar automáticamente registros borrados
-- Actualizamos las políticas para que, por defecto, solo se vean registros con deleted_at IS NULL

DO $$
DECLARE
    t text;
    tables_to_update text[] := ARRAY[
        'branches', 'users', 'customers', 'service_requests', 'service_orders', 
        'tasks', 'suppliers', 'products', 'purchase_orders', 'expenses'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_update LOOP
        -- Eliminamos la política anterior para recrearla con el filtro de borrado lógico
        EXECUTE format('DROP POLICY IF EXISTS %I_tenant_isolation_policy ON public.%I', t, t);
        
        EXECUTE format('CREATE POLICY %I_tenant_isolation_policy ON public.%I
            FOR ALL TO authenticated
            USING (tenant_id = public.get_auth_tenant_id() AND deleted_at IS NULL)
            WITH CHECK (tenant_id = public.get_auth_tenant_id() AND deleted_at IS NULL)', t, t);
    END LOOP;
END $$;

-- También para la tabla de tenants (negocios)
DROP POLICY IF EXISTS tenants_isolation_policy ON public.tenants;
CREATE POLICY tenants_isolation_policy ON public.tenants
  FOR ALL TO authenticated
  USING (id = public.get_auth_tenant_id() AND deleted_at IS NULL);
