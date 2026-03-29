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
  v_updated_referrer uuid;
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

  update public.users as u
  set balance = coalesce(u.balance, 0) + p_commission_amount
  where u.id = v_referral.referrer_user_id
  returning u.id into v_updated_referrer;

  if v_updated_referrer is null then
    raise exception 'No se pudo actualizar el balance del referrer %', v_referral.referrer_user_id;
  end if;

  return true;
end;
$$;
