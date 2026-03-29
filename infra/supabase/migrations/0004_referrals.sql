alter table public.users
  add column if not exists referral_code text,
  add column if not exists balance numeric(12,2) not null default 0;

create unique index if not exists users_referral_code_uidx
  on public.users (referral_code)
  where referral_code is not null;

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.users(id) on delete cascade,
  referred_user_id uuid not null references public.users(id) on delete cascade,
  referred_tenant_id uuid references public.tenants(id) on delete set null,
  referral_code_used text not null,
  status text not null default 'pending',
  commission_amount numeric(12,2) not null default 150.00,
  payment_provider text,
  provider_payment_id text,
  confirmed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint referrals_status_chk check (status in ('pending', 'confirmed', 'cancelled'))
);

create unique index if not exists referrals_referred_user_uidx
  on public.referrals (referred_user_id);

create index if not exists referrals_referrer_status_idx
  on public.referrals (referrer_user_id, status);

drop trigger if exists trg_referrals_updated_at on public.referrals;
create trigger trg_referrals_updated_at
before update on public.referrals
for each row execute function public.set_updated_at();

create or replace function public.confirm_referral_commission(
  p_referred_user_id uuid,
  p_provider_payment_id text,
  p_payment_provider text default 'mercadopago',
  p_commission_amount numeric default 150.00
)
returns boolean
language plpgsql
as $$
declare
  v_referral public.referrals%rowtype;
begin
  select *
  into v_referral
  from public.referrals
  where referred_user_id = p_referred_user_id
    and status = 'pending'
  order by created_at asc
  limit 1
  for update;

  if not found then
    return false;
  end if;

  update public.referrals
  set status = 'confirmed',
      commission_amount = p_commission_amount,
      payment_provider = p_payment_provider,
      provider_payment_id = p_provider_payment_id,
      confirmed_at = timezone('utc', now())
  where id = v_referral.id;

  update public.users
  set balance = coalesce(balance, 0) + p_commission_amount
  where id = v_referral.referrer_user_id;

  return true;
end;
$$;
