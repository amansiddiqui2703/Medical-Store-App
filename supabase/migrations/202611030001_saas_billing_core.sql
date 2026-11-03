-- M.S. Medical Store SaaS billing foundation.
-- Apply to a NEW Supabase project after configuring Auth. Never run against live data without a reviewed backup.
create extension if not exists pgcrypto;

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 160),
  phone text,
  address text,
  drug_license_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_subscriptions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete restrict,
  plan text not null check (plan in ('monthly','annual_vip','enterprise')),
  status text not null default 'pending' check (status in ('pending','active','past_due','cancelled','expired')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  razorpay_order_id text,
  razorpay_payment_id text unique,
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  plan text not null check (plan in ('monthly','annual_vip','enterprise')),
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  razorpay_order_id text not null unique,
  razorpay_payment_id text unique,
  status text not null default 'created' check (status in ('created','verified','applied','failed')),
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create index if not exists billing_payments_store_created_idx
  on public.billing_payments(store_id, created_at desc);

alter table public.stores enable row level security;
alter table public.store_subscriptions enable row level security;
alter table public.billing_payments enable row level security;

create policy "owners read own stores" on public.stores
  for select to authenticated using (owner_id = auth.uid());
create policy "owners create own stores" on public.stores
  for insert to authenticated with check (owner_id = auth.uid());
create policy "owners update own stores" on public.stores
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "owners read own subscription" on public.store_subscriptions
  for select to authenticated using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );
create policy "owners read own payments" on public.billing_payments
  for select to authenticated using (user_id = auth.uid());

-- Only server-side service-role code may execute this function after validating
-- the Razorpay signature AND fetching a captured payment from Razorpay's API.
create or replace function public.apply_verified_subscription(p_order_id text, p_payment_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  p billing_payments%rowtype;
  v_start timestamptz;
  v_end timestamptz;
begin
  select * into p from billing_payments
   where razorpay_order_id = p_order_id
   for update;

  if not found then raise exception 'Payment order not found'; end if;
  if p.razorpay_payment_id is not null and p.razorpay_payment_id <> p_payment_id then
    raise exception 'Payment ID mismatch';
  end if;
  if p.status = 'applied' then
    return jsonb_build_object('ok', true, 'status', 'already_applied');
  end if;
  if p.status <> 'verified' then raise exception 'Payment has not been verified'; end if;

  v_start := now();
  if p.plan = 'monthly' then
    v_end := v_start + interval '1 month';
  elsif p.plan = 'annual_vip' then
    v_end := v_start + interval '1 year';
  else
    v_end := v_start + interval '1 year';
  end if;

  insert into store_subscriptions(store_id, plan, status, current_period_start, current_period_end, razorpay_order_id, razorpay_payment_id, updated_at)
  values (p.store_id, p.plan, 'active', v_start, v_end, p_order_id, p_payment_id, now())
  on conflict (store_id) do update set
    plan = excluded.plan,
    status = 'active',
    current_period_start = case
      when store_subscriptions.status = 'active' and store_subscriptions.current_period_end > now()
      then store_subscriptions.current_period_start else excluded.current_period_start end,
    current_period_end = case
      when store_subscriptions.status = 'active' and store_subscriptions.current_period_end > now()
      then store_subscriptions.current_period_end + (excluded.current_period_end - excluded.current_period_start)
      else excluded.current_period_end end,
    razorpay_order_id = excluded.razorpay_order_id,
    razorpay_payment_id = excluded.razorpay_payment_id,
    updated_at = now();

  update billing_payments set razorpay_payment_id = p_payment_id, status = 'applied', verified_at = coalesce(verified_at, now())
   where id = p.id;

  return jsonb_build_object('ok', true, 'status', 'active', 'store_id', p.store_id, 'plan', p.plan);
end;
$$;

revoke all on function public.apply_verified_subscription(text, text) from public, anon, authenticated;
grant execute on function public.apply_verified_subscription(text, text) to service_role;
grant select, insert, update on public.stores to authenticated;
grant select on public.store_subscriptions, public.billing_payments to authenticated;
