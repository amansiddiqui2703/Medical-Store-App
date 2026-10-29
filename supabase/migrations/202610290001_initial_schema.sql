-- Medical Store App: initial multi-tenant schema for Supabase/Postgres.
-- Apply to a NEW Supabase project first. Do not run against live shop data without a backup.
create extension if not exists pgcrypto;

create type public.store_role as enum ('owner','manager','pharmacist','cashier','viewer');
create type public.invoice_status as enum ('draft','completed','cancelled','refunded');
create type public.payment_method as enum ('cash','upi','card','bank_transfer','credit','mixed');
create type public.stock_movement_type as enum ('opening','purchase','sale','sale_return','purchase_return','adjustment','expired','damaged');

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  phone text,
  address text,
  city text,
  state_code char(2) not null default '24',
  pincode text,
  gstin text,
  drug_license_number text,
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.store_memberships (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.store_role not null default 'cashier',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  gstin text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, name)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  generic_name text,
  brand text,
  strength text,
  dosage_form text,
  pack_size text,
  barcode text,
  hsn_code text,
  gst_rate numeric(5,2) not null default 0 check (gst_rate between 0 and 100),
  mrp numeric(12,2) not null default 0 check (mrp >= 0),
  purchase_rate numeric(12,2) not null default 0 check (purchase_rate >= 0),
  reorder_level integer not null default 0 check (reorder_level >= 0),
  prescription_required boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, barcode)
);

create table public.stock_batches (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  supplier_id uuid references public.suppliers(id) on delete set null,
  batch_number text not null,
  expiry_date date not null,
  quantity integer not null default 0 check (quantity >= 0),
  purchase_rate numeric(12,2) not null default 0 check (purchase_rate >= 0),
  mrp numeric(12,2) not null default 0 check (mrp >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, product_id, batch_number, expiry_date)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  phone text,
  address text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index customers_store_phone_idx on public.customers(store_id, phone);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  invoice_number text not null,
  customer_id uuid references public.customers(id) on delete set null,
  status public.invoice_status not null default 'draft',
  payment_method public.payment_method not null default 'cash',
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0),
  amount_due numeric(12,2) not null default 0 check (amount_due >= 0),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, invoice_number)
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  batch_id uuid not null references public.stock_batches(id) on delete restrict,
  product_name_snapshot text not null,
  batch_number_snapshot text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  gst_rate numeric(5,2) not null default 0 check (gst_rate between 0 and 100),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);
create index invoice_items_invoice_idx on public.invoice_items(store_id, invoice_id);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  supplier_invoice_number text,
  invoice_date date not null default current_date,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  batch_id uuid references public.stock_batches(id) on delete set null,
  batch_number text not null,
  expiry_date date not null,
  quantity integer not null check (quantity > 0),
  purchase_rate numeric(12,2) not null check (purchase_rate >= 0),
  mrp numeric(12,2) not null check (mrp >= 0),
  gst_rate numeric(5,2) not null default 0 check (gst_rate between 0 and 100),
  created_at timestamptz not null default now()
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  batch_id uuid not null references public.stock_batches(id) on delete restrict,
  movement_type public.stock_movement_type not null,
  quantity_delta integer not null check (quantity_delta <> 0),
  reference_type text,
  reference_id uuid,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index stock_movements_store_created_idx on public.stock_movements(store_id, created_at desc);

create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  invoice_id uuid references public.invoices(id) on delete set null,
  transaction_type text not null check (transaction_type in ('credit_sale','payment','adjustment','refund')),
  amount numeric(12,2) not null check (amount > 0),
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_store_created_idx on public.audit_logs(store_id, created_at desc);

create or replace function public.is_store_member(_store_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.store_memberships m
    where m.store_id = _store_id and m.user_id = auth.uid() and m.is_active = true
  );
$$;

create or replace function public.has_store_role(_store_id uuid, _roles public.store_role[])
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.store_memberships m
    where m.store_id = _store_id and m.user_id = auth.uid()
      and m.is_active = true and m.role = any(_roles)
  );
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;

do $$
declare t text;
begin
  foreach t in array array['stores','suppliers','products','stock_batches','customers','invoices'] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- All tenant tables are protected by store membership. Never put service-role keys in a browser.
alter table public.stores enable row level security;
alter table public.store_memberships enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.stock_batches enable row level security;
alter table public.customers enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.audit_logs enable row level security;

create policy "members can read their stores" on public.stores for select using (public.is_store_member(id));
create policy "owners can update their stores" on public.stores for update using (public.has_store_role(id, array['owner']::public.store_role[])) with check (public.has_store_role(id, array['owner']::public.store_role[]));
create policy "members can read memberships" on public.store_memberships for select using (public.is_store_member(store_id));
create policy "owners/managers manage memberships" on public.store_memberships for all using (public.has_store_role(store_id, array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, array['owner','manager']::public.store_role[]));

create policy "store members manage suppliers" on public.suppliers for all using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));
create policy "store members read products" on public.products for select using (public.is_store_member(store_id));
create policy "managers manage products" on public.products for insert with check (public.has_store_role(store_id, array['owner','manager','pharmacist']::public.store_role[]));
create policy "managers update products" on public.products for update using (public.has_store_role(store_id, array['owner','manager','pharmacist']::public.store_role[])) with check (public.has_store_role(store_id, array['owner','manager','pharmacist']::public.store_role[]));
create policy "owners manage product deletion" on public.products for delete using (public.has_store_role(store_id, array['owner']::public.store_role[]));

create policy "store members read batches" on public.stock_batches for select using (public.is_store_member(store_id));
create policy "authorized staff manage batches" on public.stock_batches for all using (public.has_store_role(store_id, array['owner','manager','pharmacist']::public.store_role[])) with check (public.has_store_role(store_id, array['owner','manager','pharmacist']::public.store_role[]));
create policy "store members manage customers" on public.customers for all using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));
create policy "store members read invoices" on public.invoices for select using (public.is_store_member(store_id));
create policy "authorized staff create invoices" on public.invoices for insert with check (public.has_store_role(store_id, array['owner','manager','pharmacist','cashier']::public.store_role[]));
create policy "owners/managers update invoices" on public.invoices for update using (public.has_store_role(store_id, array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, array['owner','manager']::public.store_role[]));
create policy "owners can delete draft invoices" on public.invoices for delete using (status = 'draft' and public.has_store_role(store_id, array['owner']::public.store_role[]));

create policy "members read invoice items" on public.invoice_items for select using (public.is_store_member(store_id));
create policy "authorized staff add invoice items" on public.invoice_items for insert with check (public.has_store_role(store_id, array['owner','manager','pharmacist','cashier']::public.store_role[]));
create policy "owners manage invoice items" on public.invoice_items for update using (public.has_store_role(store_id, array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, array['owner','manager']::public.store_role[]));
create policy "owners manage purchases" on public.purchases for all using (public.has_store_role(store_id, array['owner','manager','pharmacist']::public.store_role[])) with check (public.has_store_role(store_id, array['owner','manager','pharmacist']::public.store_role[]));
create policy "owners manage purchase items" on public.purchase_items for all using (public.has_store_role(store_id, array['owner','manager','pharmacist']::public.store_role[])) with check (public.has_store_role(store_id, array['owner','manager','pharmacist']::public.store_role[]));
create policy "members read stock movements" on public.stock_movements for select using (public.is_store_member(store_id));
create policy "authorized staff create stock movements" on public.stock_movements for insert with check (public.has_store_role(store_id, array['owner','manager','pharmacist']::public.store_role[]));
create policy "members read credit transactions" on public.credit_transactions for select using (public.is_store_member(store_id));
create policy "authorized staff create credit transactions" on public.credit_transactions for insert with check (public.has_store_role(store_id, array['owner','manager','cashier']::public.store_role[]));
create policy "owners/managers read audit logs" on public.audit_logs for select using (public.has_store_role(store_id, array['owner','manager']::public.store_role[]));
create policy "members create audit logs" on public.audit_logs for insert with check (public.is_store_member(store_id));
