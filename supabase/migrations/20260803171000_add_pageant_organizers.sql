-- Add Pageant Organizations as a distinct Pageant Index audience.
-- Apply after 20260803170000_expand_audiences_media_content.sql.

alter table public.user_profiles
  drop constraint if exists user_profiles_account_type_check;

alter table public.user_profiles
  add constraint user_profiles_account_type_check
  check (account_type in ('enthusiast','candidate','supplier','media','organizer'));

create table if not exists public.pageant_organization_drafts (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  organization_name text not null default '' check (char_length(organization_name) <= 220),
  organization_type text check (organization_type is null or char_length(organization_type) <= 140),
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pageant_organization_drafts enable row level security;
revoke all on public.pageant_organization_drafts from anon, authenticated;
grant select on public.pageant_organization_drafts to authenticated;
grant insert (
  user_id, organization_name, organization_type, official_url, public_email,
  bio, country_code, country_name, city, region, submission_state
) on public.pageant_organization_drafts to authenticated;
grant update (
  organization_name, organization_type, official_url, public_email,
  bio, country_code, country_name, city, region, submission_state
) on public.pageant_organization_drafts to authenticated;

create policy "Organizers read their organization and admins read all"
on public.pageant_organization_drafts for select to authenticated
using (
  user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

create policy "Organizers create their organization"
on public.pageant_organization_drafts for insert to authenticated
with check (user_id = (select auth.uid()) and review_state = 'pending');

create policy "Organizers update their organization"
on public.pageant_organization_drafts for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pageant_edition_drafts_organizer_idx
  on public.pageant_edition_drafts (organizer_user_id, edition_year desc, updated_at desc);

alter table public.pageant_edition_drafts enable row level security;
revoke all on public.pageant_edition_drafts from anon, authenticated;
grant select, insert, update, delete on public.pageant_edition_drafts to authenticated;

create policy "Organizers and admins read edition drafts"
on public.pageant_edition_drafts for select to authenticated
using (
  organizer_user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

create policy "Organizers create edition drafts"
on public.pageant_edition_drafts for insert to authenticated
with check (organizer_user_id = (select auth.uid()) and review_state = 'pending');

create policy "Organizers update edition drafts"
on public.pageant_edition_drafts for update to authenticated
using (organizer_user_id = (select auth.uid()))
with check (organizer_user_id = (select auth.uid()));

create policy "Organizers delete unpublished edition drafts"
on public.pageant_edition_drafts for delete to authenticated
using (organizer_user_id = (select auth.uid()) and review_state <> 'approved');

create table if not exists public.pageant_candidate_roster_drafts (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.pageant_edition_drafts(id) on delete cascade,
  organizer_user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  candidate_display_name text not null check (char_length(candidate_display_name) between 2 and 180),
  candidate_user_id uuid references auth.users(id) on delete set null,
  representation text check (representation is null or char_length(representation) <= 180),
  candidate_number text check (candidate_number is null or char_length(candidate_number) <= 40),
  status text not null default 'draft'
    check (status in ('draft','confirmed','withdrawn','disqualified','completed')),
  title_or_placement text check (title_or_placement is null or char_length(title_or_placement) <= 220),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pageant_roster_edition_idx
  on public.pageant_candidate_roster_drafts (edition_id, status, candidate_number);

alter table public.pageant_candidate_roster_drafts enable row level security;
revoke all on public.pageant_candidate_roster_drafts from anon, authenticated;
grant select, insert, update, delete on public.pageant_candidate_roster_drafts to authenticated;

create policy "Organizers and admins manage roster drafts"
on public.pageant_candidate_roster_drafts for all to authenticated
using (
  organizer_user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
)
with check (
  organizer_user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

create table if not exists public.pageant_experience_requests (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.pageant_edition_drafts(id) on delete cascade,
  organizer_user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  experience_type text not null
    check (experience_type in ('voting','livestream','pay_per_view','tickets','merchandise')),
  title text not null check (char_length(title) between 2 and 220),
  description text check (description is null or char_length(description) <= 3000),
  guest_access_requested boolean not null default true,
  provider_name text check (provider_name is null or char_length(provider_name) <= 220),
  provider_url text check (provider_url is null or char_length(provider_url) <= 1000),
  starts_at timestamptz,
  ends_at timestamptz,
  submission_state text not null default 'draft'
    check (submission_state in ('draft','submitted','withdrawn')),
  review_state text not null default 'pending'
    check (review_state in ('pending','in_review','changes_requested','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pageant_experience_requests enable row level security;
revoke all on public.pageant_experience_requests from anon, authenticated;
grant select, insert, update, delete on public.pageant_experience_requests to authenticated;

create policy "Organizers and admins manage experience requests"
on public.pageant_experience_requests for all to authenticated
using (
  organizer_user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
)
with check (
  organizer_user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

create table if not exists public.organizer_announcement_requests (
  id uuid primary key default gen_random_uuid(),
  organizer_user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  edition_id uuid references public.pageant_edition_drafts(id) on delete cascade,
  title text not null check (char_length(title) between 4 and 220),
  summary text not null default '' check (char_length(summary) <= 1000),
  target_url text check (target_url is null or char_length(target_url) <= 1000),
  submission_state text not null default 'draft'
    check (submission_state in ('draft','submitted','withdrawn')),
  review_state text not null default 'pending'
    check (review_state in ('pending','in_review','changes_requested','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizer_announcement_requests enable row level security;
revoke all on public.organizer_announcement_requests from anon, authenticated;
grant select, insert, update, delete on public.organizer_announcement_requests to authenticated;

create policy "Organizers and admins manage announcement requests"
on public.organizer_announcement_requests for all to authenticated
using (
  organizer_user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
)
with check (
  organizer_user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

create or replace function public.admin_review_pageant_organization(
  profile_user_id uuid,
  next_review_state text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') <> 'admin' then
    raise exception 'Administrator access required';
  end if;
  if next_review_state not in ('pending','in_review','changes_requested','approved','rejected') then
    raise exception 'Invalid review state';
  end if;
  update public.pageant_organization_drafts
  set review_state = next_review_state, updated_at = now()
  where user_id = profile_user_id;
end;
$$;

revoke all on function public.admin_review_pageant_organization(uuid, text) from public;
grant execute on function public.admin_review_pageant_organization(uuid, text) to authenticated;

drop trigger if exists pageant_organization_drafts_set_updated_at on public.pageant_organization_drafts;
create trigger pageant_organization_drafts_set_updated_at
before update on public.pageant_organization_drafts
for each row execute function public.pageantindex_set_updated_at();

drop trigger if exists pageant_edition_drafts_set_updated_at on public.pageant_edition_drafts;
create trigger pageant_edition_drafts_set_updated_at
before update on public.pageant_edition_drafts
for each row execute function public.pageantindex_set_updated_at();

drop trigger if exists pageant_candidate_roster_drafts_set_updated_at on public.pageant_candidate_roster_drafts;
create trigger pageant_candidate_roster_drafts_set_updated_at
before update on public.pageant_candidate_roster_drafts
for each row execute function public.pageantindex_set_updated_at();

drop trigger if exists pageant_experience_requests_set_updated_at on public.pageant_experience_requests;
create trigger pageant_experience_requests_set_updated_at
before update on public.pageant_experience_requests
for each row execute function public.pageantindex_set_updated_at();

drop trigger if exists organizer_announcement_requests_set_updated_at on public.organizer_announcement_requests;
create trigger organizer_announcement_requests_set_updated_at
before update on public.organizer_announcement_requests
for each row execute function public.pageantindex_set_updated_at();
