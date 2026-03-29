create or replace function public.apply_referral_commission_from_subscription_payment()
returns trigger
language plpgsql
as $$
declare
  v_referred_user_id uuid;
  v_referral public.referrals%rowtype;
begin
  if new.provider_payment_status <> 'approved' then
    return new;
  end if;

  select u.id
  into v_referred_user_id
  from public.users u
  where u.tenant_id = new.tenant_id
  order by u.created_at asc
  limit 1;

  if v_referred_user_id is null then
    return new;
  end if;

  select *
  into v_referral
  from public.referrals
  where referred_user_id = v_referred_user_id
    and status = 'pending'
  order by created_at asc
  limit 1
  for update;

  if not found then
    return new;
  end if;

  update public.referrals
  set status = 'confirmed',
      payment_provider = new.provider,
      provider_payment_id = new.provider_payment_id,
      confirmed_at = coalesce(new.paid_at, timezone('utc', now()))
  where id = v_referral.id;

  update public.users
  set balance = coalesce(balance, 0) + coalesce(v_referral.commission_amount, 150.00)
  where id = v_referral.referrer_user_id;

  return new;
end;
$$;

drop trigger if exists trg_subscription_payments_referral on public.subscription_payments;
create trigger trg_subscription_payments_referral
after insert or update of provider_payment_status on public.subscription_payments
for each row execute function public.apply_referral_commission_from_subscription_payment();
