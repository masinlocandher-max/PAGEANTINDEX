create extension if not exists pgcrypto;

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  public_name text not null check (char_length(public_name) between 2 and 120),
  category text not null,
  location text not null,
  city text,
  headline text,
  biography text,
  public_email text,
  mobile text,
  website_url text,
  social_url text,
  logo_url text,
  cover_url text,
  services text[] not null default '{}',
  years_experience integer check (years_experience between 0 and 100),
  accepts_nationwide boolean not null default false,
  available_for_travel boolean not null default false,
  status text not null default 'draft'
    check (status in ('draft','pending_review','published','unpublished','archived')),
  verification_status text not null default 'not_requested'
    check (verification_status in ('not_requested','pending','verified','rejected','expired')),
  featured boolean not null default false,
  featured_label text,
  sort_order integer not null default 0,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index suppliers_public_directory_idx
  on public.suppliers (status, featured desc, sort_order, public_name);
create index suppliers_category_idx
  on public.suppliers (category) where status = 'published';
create index suppliers_location_idx
  on public.suppliers (location) where status = 'published';
create index suppliers_created_by_idx on public.suppliers (created_by);
create index suppliers_updated_by_idx on public.suppliers (updated_by);

create table public.supplier_audit_log (
  id bigint generated always as identity primary key,
  supplier_id uuid references public.suppliers(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create index supplier_audit_log_supplier_id_idx
  on public.supplier_audit_log (supplier_id);
create index supplier_audit_log_actor_id_idx
  on public.supplier_audit_log (actor_id);

create or replace function public.set_supplier_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  if new.status = 'published' and old.status is distinct from 'published' then
    new.published_at = coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;

create trigger suppliers_set_updated_at
before update on public.suppliers
for each row execute function public.set_supplier_updated_at();

create or replace function public.audit_supplier_change()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  insert into public.supplier_audit_log
    (supplier_id, actor_id, action, before_state, after_state)
  values (
    case when tg_op = 'DELETE' then null else new.id end,
    auth.uid(),
    lower(tg_op),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

create trigger suppliers_audit_changes
after insert or update or delete on public.suppliers
for each row execute function public.audit_supplier_change();

alter table public.suppliers enable row level security;
alter table public.supplier_audit_log enable row level security;

grant select on public.suppliers to anon, authenticated;
grant insert, update, delete on public.suppliers to authenticated;
grant select, insert on public.supplier_audit_log to authenticated;
grant usage, select on sequence public.supplier_audit_log_id_seq to authenticated;

create policy "Published suppliers are public"
on public.suppliers for select to anon
using (status = 'published');

create policy "Authenticated users see published suppliers"
on public.suppliers for select to authenticated
using (
  status = 'published'
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

create policy "Admins create suppliers"
on public.suppliers for insert to authenticated
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins update suppliers"
on public.suppliers for update to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins delete suppliers"
on public.suppliers for delete to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins read supplier audit log"
on public.supplier_audit_log for select to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins write supplier audit log"
on public.supplier_audit_log for insert to authenticated
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
