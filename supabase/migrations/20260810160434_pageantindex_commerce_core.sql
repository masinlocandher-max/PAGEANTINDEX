create table public.commerce_offers (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.pageant_edition_drafts(id) on delete cascade,
  organizer_user_id uuid not null references auth.users(id) on delete cascade,
  offer_type text not null check (offer_type in ('ticket','ppv','merchandise')),
  name text not null check (length(name) between 2 and 180),
  description text null check (description is null or length(description)<=2000),
  price_minor bigint not null check (price_minor>=0),
  currency text not null default 'PHP' check (currency='PHP'),
  inventory_limit integer null check (inventory_limit is null or inventory_limit>=0),
  sale_starts_at timestamptz null,
  sale_ends_at timestamptz null,
  status text not null default 'draft' check (status in ('draft','scheduled','active','sold_out','closed','canceled')),
  review_state text not null default 'pending' check (review_state in ('pending','approved','changes_requested','rejected','suspended')),
  published_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commerce_offer_dates check (sale_ends_at is null or sale_starts_at is null or sale_ends_at>sale_starts_at),
  constraint commerce_offer_metadata_object check (jsonb_typeof(metadata)='object')
);
create index commerce_offers_public_idx on public.commerce_offers(edition_id,offer_type,status) where review_state='approved' and published_at is not null;
alter table public.commerce_offers enable row level security;

create table public.commerce_orders (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique default ('PI-ORD-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  offer_id uuid null references public.commerce_offers(id) on delete set null,
  buyer_user_id uuid null references auth.users(id) on delete set null,
  buyer_email text null,
  buyer_name text null,
  quantity integer not null check (quantity>0 and quantity<=1000),
  unit_amount_minor bigint not null check (unit_amount_minor>=0),
  amount_minor bigint not null check (amount_minor>=0),
  currency text not null default 'PHP' check (currency='PHP'),
  status text not null default 'pending_payment' check (status in ('pending_payment','paid','fulfilled','canceled','refunded','partially_refunded')),
  payment_transaction_id uuid null unique references public.payment_transactions(id) on delete set null,
  fulfillment_data jsonb not null default '{}'::jsonb,
  paid_at timestamptz null,
  fulfilled_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commerce_order_amount_check check (amount_minor=unit_amount_minor*quantity),
  constraint commerce_order_fulfillment_object check (jsonb_typeof(fulfillment_data)='object')
);
create index commerce_orders_offer_status_idx on public.commerce_orders(offer_id,status,created_at desc);
create index commerce_orders_buyer_idx on public.commerce_orders(buyer_user_id,created_at desc) where buyer_user_id is not null;
alter table public.commerce_orders enable row level security;

create table public.commerce_access_credentials (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.commerce_orders(id) on delete cascade,
  offer_id uuid not null references public.commerce_offers(id) on delete cascade,
  credential_type text not null check (credential_type in ('ticket','ppv_access','download')),
  token_hash text not null unique,
  status text not null default 'active' check (status in ('active','redeemed','revoked','expired')),
  expires_at timestamptz null,
  redeemed_at timestamptz null,
  redeemed_by_user_id uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(order_id,credential_type)
);
create index commerce_credentials_offer_status_idx on public.commerce_access_credentials(offer_id,status);
alter table public.commerce_access_credentials enable row level security;

create trigger commerce_offers_touch_updated_at before update on public.commerce_offers for each row execute function private.pageantindex_touch_updated_at();
create trigger commerce_orders_touch_updated_at before update on public.commerce_orders for each row execute function private.pageantindex_touch_updated_at();

create policy "Public reads approved commerce offers" on public.commerce_offers
for select to anon using (review_state='approved' and published_at is not null and status in ('scheduled','active','sold_out','closed'));
create policy "Users read approved or owned commerce offers" on public.commerce_offers
for select to authenticated using ((review_state='approved' and published_at is not null) or organizer_user_id=(select auth.uid()) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy "Organizers create own commerce offers" on public.commerce_offers
for insert to authenticated with check (organizer_user_id=(select auth.uid()) and review_state='pending' and published_at is null and exists(select 1 from public.pageant_edition_drafts e where e.id=commerce_offers.edition_id and e.organizer_user_id=(select auth.uid())));
create policy "Organizers update own commerce offers" on public.commerce_offers
for update to authenticated using (organizer_user_id=(select auth.uid())) with check (organizer_user_id=(select auth.uid()) and exists(select 1 from public.pageant_edition_drafts e where e.id=commerce_offers.edition_id and e.organizer_user_id=(select auth.uid())));
create policy "Admins manage commerce offers" on public.commerce_offers
for all to authenticated using ((((select auth.jwt())->'app_metadata'->>'role'))='admin') with check ((((select auth.jwt())->'app_metadata'->>'role'))='admin');

create policy "Authenticated buyers read own orders" on public.commerce_orders
for select to authenticated using (buyer_user_id=(select auth.uid()) or (((select auth.jwt())->'app_metadata'->>'role')='admin') or exists(select 1 from public.commerce_offers o where o.id=commerce_orders.offer_id and o.organizer_user_id=(select auth.uid())));
create policy "Admins manage commerce orders" on public.commerce_orders
for all to authenticated using ((((select auth.jwt())->'app_metadata'->>'role'))='admin') with check ((((select auth.jwt())->'app_metadata'->>'role'))='admin');
create policy "Owners and admins read access credentials" on public.commerce_access_credentials
for select to authenticated using (exists(select 1 from public.commerce_orders o join public.commerce_offers f on f.id=o.offer_id where o.id=commerce_access_credentials.order_id and (o.buyer_user_id=(select auth.uid()) or f.organizer_user_id=(select auth.uid()))) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy "Admins manage access credentials" on public.commerce_access_credentials
for all to authenticated using ((((select auth.jwt())->'app_metadata'->>'role'))='admin') with check ((((select auth.jwt())->'app_metadata'->>'role'))='admin');

grant select on public.commerce_offers to anon;
grant select,insert on public.commerce_offers to authenticated;
grant update (offer_type,name,description,price_minor,currency,inventory_limit,sale_starts_at,sale_ends_at,status,metadata) on public.commerce_offers to authenticated;
grant select on public.commerce_orders,public.commerce_access_credentials to authenticated;

create view public.commerce_offer_sales with (security_invoker=true) as
select o.id as offer_id,
  coalesce(sum(ord.quantity) filter(where ord.status in ('paid','fulfilled')),0)::bigint as units_sold,
  coalesce(sum(ord.amount_minor) filter(where ord.status in ('paid','fulfilled')),0)::bigint as gross_sales_minor
from public.commerce_offers o
left join public.commerce_orders ord on ord.offer_id=o.id
group by o.id;
grant select on public.commerce_offer_sales to authenticated;
