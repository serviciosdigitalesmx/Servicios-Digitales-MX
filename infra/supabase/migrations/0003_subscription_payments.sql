create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  provider text not null default 'mercadopago',
  provider_payment_id text not null,
  provider_payment_status text not null,
  amount numeric(12,2),
  currency_id text,
  payer_email text,
  paid_at timestamptz not null default timezone('utc', now()),
  raw_payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists subscription_payments_provider_payment_uidx
  on public.subscription_payments (provider, provider_payment_id);

create index if not exists subscription_payments_tenant_paid_at_idx
  on public.subscription_payments (tenant_id, paid_at desc);

create index if not exists subscription_payments_subscription_paid_at_idx
  on public.subscription_payments (subscription_id, paid_at desc);
