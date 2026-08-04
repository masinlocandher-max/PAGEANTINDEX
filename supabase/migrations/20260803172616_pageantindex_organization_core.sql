-- Live PageantIndex organization identity and edition migration.
-- Mirrors Supabase migration 20260803172616.

create table if not exists public.pageant_organization_drafts (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  organization_name text not null default ''
    check (char_length(organization_name) <= 220),
  organization_type text
    check (organization_type is null or char_length(organization_type) <= 140),
  official_url text check (official_url is null or char_length(official_url) <= 1000),
  public_email text check (public_email is null or char_length(public_email) <= 320),
  bio text check (bio is null or char_length(bio) <= 4000),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  country_name text check (country_name is null or char_length(country_name) <= 120),
  city text check (city is null or char_length(city) <= 100),
  region text check (region is null or char_length(region) <= 120),
  submission_state text not null default 'draft'
    check (submission_state in ('draft','submitted','withdrawn')),
  review_state text not null default 'pending'
    check (review_state in ('pending','in_review','changes_requested','approved','rejected')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pageant_organization_drafts enable row level security;
revoke all on public.pageant_organization_drafts from anon, authenticated;
grant select (
  organization_name, organization_type, official_url, public_email, bio,
  country_code, country_name, city, region, submission_state, review_state,
  published_at
) on public.pageant_organization_drafts to anon;
grant select on public.pageant_organization_drafts to authenticated;
grant insert (
  user_id, organization_name, organization_type, official_url, public_email,
  bio, country_code, country_name, city, region, submission_state
) on public.pageant_organization_drafts to authenticated;
grant update (
  organization_name, organization_type, official_url, public_email,
  bio, country_code, country_name, city, region, submission_state
) on public.pageant_organization_drafts to authenticated;

create policy "Public reads approved pageant organizations"
on public.pageant_organization_drafts for select
using (
  review_state = 'approved'
  and submission_state = 'submitted'
  and published_at is not null
);
create policy "Organizers read their organization and admins read all"
on public.pageant_organization_drafts for select to authenticated
using (
  user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);
create policy "Organizers create their organization"
on public.pageant_organization_drafts for insert to authenticated
with check (
  user_id = (select auth.uid())
  and review_state = 'pending'
  and published_at is null
  and (select public.pageantindex_is_organizer())
);
create policy "Organizers update their organization"
on public.pageant_organization_drafts for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (select public.pageantindex_is_organizer())
);

create trigger pageant_organization_drafts_set_updated_at
before update on public.pageant_organization_drafts
for each row execute function public.pageantindex_set_updated_at();

create table if not exists public.pageant_edition_drafts (
  id uuid primary key default gen_random_uuid(),
  organizer_user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  organization_name text check (organization_name is null or char_length(organization_name) <= 220),
  pageant_name text not null check (char_length(pageant_name) between 2 and 220),
  edition_name text check (edition_name is null or char_length(edition_name) <= 160),
  edition_year integer check (edition_year is null or edition_year between 1900 and 2100),
  application_open_at timestamptz,
  application_close_at timestamptz,
  event_start_at timestamptz,
  event_end_at timestamptz,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  country_name text check (country_name is null or char_length(country_name) <= 120),
  city text check (city is null or char_length(city) <= 100),
  venue text check (venue is null or char_length(venue) <= 220),
  official_url text check (official_url is null or char_length(official_url) <= 1000),
  application_url text check (application_url is null or char_length(application_url) <= 1000),
  rules_url text check (rules_url is null or char_length(rules_url) <= 1000),
  description text check (description is null or char_length(description) <= 5000),
  submission_state text not null default 'draft'
    check (submission_state in ('draft','submitted','withdrawn')),
  review_state text not null default 'pending'
    check (review_state in ('pending','in_review','changes_requested','approved','rejected')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pageant_edition_drafts_organizer_idx
  on public.pageant_edition_drafts
  (organizer_user_id, edition_year desc, updated_at desc);
create index pageant_edition_public_idx
  on public.pageant_edition_drafts
  (review_state, published_at desc, event_start_at);

create or replace function public.pageantindex_fill_edition_organization()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  organization_record public.pageant_organization_drafts%rowtype;
begin
  select * into organization_record
  from public.pageant_organization_drafts
  where user_id = new.organizer_user_id;

  if found then
    new.organization_name :=
      coalesce(new.organization_name, organization_record.organization_name);
    new.country_code :=
      coalesce(new.country_code, organization_record.country_code);
    new.country_name :=
      coalesce(new.country_name, organization_record.country_name);
    new.city := coalesce(new.city, organization_record.city);
  end if;
  return new;
end;
$$;

revoke all on function public.pageantindex_fill_edition_organization() from public;
grant execute on function public.pageantindex_fill_edition_organization()
  to authenticated;

create trigger pageant_edition_fill_organization
before insert or update on public.pageant_edition_drafts
for each row execute function public.pageantindex_fill_edition_organization();

alter table public.pageant_edition_drafts enable row level security;
revoke all on public.pageant_edition_drafts from anon, authenticated;
grant select (
  id, organization_name, pageant_name, edition_name, edition_year,
  application_open_at, application_close_at, event_start_at, event_end_at,
  country_code, country_name, city, venue, official_url, application_url,
  rules_url, description, submission_state, review_state, published_at
) on public.pageant_edition_drafts to anon;
grant select on public.pageant_edition_drafts to authenticated;
grant insert (
  organizer_user_id, organization_name, pageant_name, edition_name, edition_year,
  application_open_at, application_close_at, event_start_at, event_end_at,
  country_code, country_name, city, venue, official_url, application_url,
  rules_url, description, submission_state
) on public.pageant_edition_drafts to authenticated;
grant update (
  organization_name, pageant_name, edition_name, edition_year,
  application_open_at, application_close_at, event_start_at, event_end_at,
  country_code, country_name, city, venue, official_url, application_url,
  rules_url, description, submission_state
) on public.pageant_edition_drafts to authenticated;
grant delete on public.pageant_edition_drafts to authenticated;

create policy "Public reads approved pageant editions"
on public.pageant_edition_drafts for select
using (
  review_state = 'approved'
  and submission_state = 'submitted'
  and published_at is not null
);
create policy "Organizers and admins read edition drafts"
on public.pageant_edition_drafts for select to authenticated
using (
  organizer_user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);
create policy "Organizers create edition drafts"
on public.pageant_edition_drafts for insert to authenticated
with check (
  organizer_user_id = (select auth.uid())
  and review_state = 'pending'
  and published_at is null
  and (select public.pageantindex_is_organizer())
);
create policy "Organizers update edition drafts"
on public.pageant_edition_drafts for update to authenticated
using (organizer_user_id = (select auth.uid()))
with check (
  organizer_user_id = (select auth.uid())
  and (select public.pageantindex_is_organizer())
);
create policy "Organizers delete unpublished edition drafts"
on public.pageant_edition_drafts for delete to authenticated
using (
  organizer_user_id = (select auth.uid())
  and review_state <> 'approved'
);

create trigger pageant_edition_drafts_set_updated_at
before update on public.pageant_edition_drafts
for each row execute function public.pageantindex_set_updated_at();
