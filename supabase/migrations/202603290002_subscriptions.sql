-- Servicios Digitales MX
-- Subscriptions y control comercial por Shop

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan_code text not null default 'base-350',
  plan_name text not null default 'Plan Base',
  price_mxn numeric(12,2) not null default 350.00,
  billing_interval text not null default 'monthly',
  status text not null default 'trialing',
  current_period_start timestamptz,
  current_period_end timestamptz,
  grace_until timestamptz,
  cancel_at_period_end boolean not null default false,
  external_provider text,
  external_subscription_id text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint subscriptions_status_chk
    check (status in ('trialing', 'active', 'past_due', 'suspended', 'cancelled')),
  constraint subscriptions_billing_interval_chk
    check (billing_interval in ('monthly', 'quarterly', 'yearly'))
);

create index if not exists subscriptions_tenant_idx
  on public.subscriptions (tenant_id);

create index if not exists subscriptions_status_idx
  on public.subscriptions (status);

create unique index if not exists subscriptions_provider_external_uidx
  on public.subscriptions (external_provider, external_subscription_id)
  where external_provider is not null and external_subscription_id is not null;

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();
