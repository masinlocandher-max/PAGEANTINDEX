-- Live PageantIndex foundation migration.
-- Mirrors Supabase migration 20260803172117.

create extension if not exists pgcrypto;

create or replace function public.pageantindex_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.pageantindex_set_updated_at() from public;
grant execute on function public.pageantindex_set_updated_at() to authenticated;

alter table public.suppliers
  add column if not exists primary_category text,
  add column if not exists additional_categories text[] not null default '{}',
  add column if not exists category_other text,
  add column if not exists country_code text,
  add column if not exists country_name text,
  add column if not exists region text;

update public.suppliers
set primary_category = coalesce(primary_category, category)
where primary_category is null;

alter table public.suppliers
  drop constraint if exists suppliers_country_code_check,
  add constraint suppliers_country_code_check
    check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  drop constraint if exists suppliers_additional_categories_check,
  add constraint suppliers_additional_categories_check
    check (cardinality(additional_categories) <= 12),
  drop constraint if exists suppliers_category_other_check,
  add constraint suppliers_category_other_check
    check (
      not (
        primary_category = 'Other'
        or 'Other' = any(additional_categories)
      )
      or nullif(btrim(category_other), '') is not null
    );

create index if not exists suppliers_global_discovery_idx
  on public.suppliers
  (status, country_code, primary_category, featured desc, sort_order asc);

revoke update on public.suppliers from authenticated;
grant update (
  slug, public_name, category, primary_category, additional_categories,
  category_other, location, city, region, country_code, country_name,
  headline, biography, public_email, mobile, website_url, social_url,
  logo_url, cover_url, services, years_experience, accepts_nationwide,
  available_for_travel, status, verification_status, featured,
  featured_label, sort_order, published_at
) on public.suppliers to authenticated;

create table if not exists public.intake_submissions (
  id uuid primary key default gen_random_uuid(),
  submission_type text not null check (
    submission_type in (
      'inquiry','claim','verification','review','report','advertising',
      'newsletter','professional_invitation','event','membership_interest'
    )
  ),
  supplier_id uuid references public.suppliers(id) on delete set null,
  submitted_by uuid default auth.uid() references auth.users(id) on delete set null,
  contact_name text check (contact_name is null or char_length(contact_name) between 2 and 160),
  contact_email text check (contact_email is null or char_length(contact_email) between 5 and 320),
  contact_mobile text check (contact_mobile is null or char_length(contact_mobile) between 5 and 40),
  payload jsonb not null default '{}'::jsonb check (
    jsonb_typeof(payload) = 'object'
    and octet_length(payload::text) <= 32768
  ),
  status text not null default 'pending'
    check (status in ('pending','in_review','resolved','rejected','spam')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists intake_submissions_queue_idx
  on public.intake_submissions (status, created_at);
create index if not exists intake_submissions_supplier_idx
  on public.intake_submissions (supplier_id, created_at desc)
  where supplier_id is not null;

alter table public.intake_submissions enable row level security;
revoke all on public.intake_submissions from anon, authenticated;
grant insert (
  submission_type, supplier_id, contact_name, contact_email, contact_mobile, payload
) on public.intake_submissions to anon, authenticated;
grant select on public.intake_submissions to authenticated;
grant update (status, reviewed_by, reviewed_at)
  on public.intake_submissions to authenticated;

drop policy if exists "Public can create pending intake" on public.intake_submissions;
create policy "Public can create pending intake"
on public.intake_submissions for insert to anon, authenticated
with check (
  status = 'pending'
  and submitted_by is not distinct from (select auth.uid())
  and reviewed_by is null
  and reviewed_at is null
);

drop policy if exists "Admins read intake" on public.intake_submissions;
create policy "Admins read intake"
on public.intake_submissions for select to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins update intake" on public.intake_submissions;
create policy "Admins update intake"
on public.intake_submissions for update to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  account_type text not null
    check (account_type in ('enthusiast','candidate','supplier','media','organizer')),
  full_name_private text
    check (full_name_private is null or char_length(full_name_private) between 2 and 160),
  display_name text
    check (display_name is null or char_length(display_name) between 2 and 220),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  country_name text
    check (country_name is null or char_length(country_name) between 2 and 120),
  city text check (city is null or char_length(city) between 1 and 100),
  region text check (region is null or char_length(region) <= 120),
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_profiles_account_country_idx
  on public.user_profiles (account_type, country_code, city);

alter table public.user_profiles enable row level security;
revoke all on public.user_profiles from anon, authenticated;
grant select on public.user_profiles to authenticated;
grant insert (
  user_id, account_type, full_name_private, display_name, country_code,
  country_name, city, region, terms_accepted_at, privacy_accepted_at
) on public.user_profiles to authenticated;
grant update (
  account_type, full_name_private, display_name, country_code,
  country_name, city, region, terms_accepted_at, privacy_accepted_at
) on public.user_profiles to authenticated;

drop policy if exists "Users read their profile and admins read all" on public.user_profiles;
create policy "Users read their profile and admins read all"
on public.user_profiles for select to authenticated
using (
  user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Users create their profile" on public.user_profiles;
create policy "Users create their profile"
on public.user_profiles for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Users update their profile" on public.user_profiles;
create policy "Users update their profile"
on public.user_profiles for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.pageantindex_set_updated_at();

create or replace function public.pageantindex_is_organizer()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_profiles
    where user_id = (select auth.uid())
      and account_type = 'organizer'
  );
$$;

revoke all on function public.pageantindex_is_organizer() from public;
grant execute on function public.pageantindex_is_organizer() to authenticated;
