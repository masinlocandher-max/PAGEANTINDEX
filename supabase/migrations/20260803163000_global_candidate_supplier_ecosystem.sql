-- Pageant Index global candidate and supplier ecosystem.
-- Apply after 20260731215441_add_pageantindex_intake_and_profile_drafts.sql.

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  account_type text not null check (account_type in ('candidate','supplier')),
  full_name_private text check (full_name_private is null or char_length(full_name_private) between 2 and 160),
  display_name text check (display_name is null or char_length(display_name) between 2 and 160),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  country_name text check (country_name is null or char_length(country_name) between 2 and 120),
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

create policy "Users read their profile and admins read all"
on public.user_profiles for select to authenticated
using (
  user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

create policy "Users create their profile"
on public.user_profiles for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "Users update their profile"
on public.user_profiles for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create table if not exists public.candidate_profile_drafts (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  display_name text not null default '' check (char_length(display_name) <= 160),
  candidate_status text check (
    candidate_status is null or candidate_status in (
      'Aspiring candidate',
      'Current candidate',
      'Titleholder',
      'Former candidate or titleholder'
    )
  ),
  pageant_title text check (pageant_title is null or char_length(pageant_title) <= 160),
  primary_goal text check (
    primary_goal is null or primary_goal in (
      'Find pageants',
      'Find suppliers',
      'Build my candidate profile',
      'Find flights or hotels',
      'Find sponsors or opportunities'
    )
  ),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  country_name text check (country_name is null or char_length(country_name) between 2 and 120),
  city text check (city is null or char_length(city) between 1 and 100),
  region text check (region is null or char_length(region) <= 120),
  public_bio text check (public_bio is null or char_length(public_bio) <= 3000),
  profile_visibility text not null default 'private' check (profile_visibility in ('private','review','published')),
  review_state text not null default 'pending' check (review_state in ('pending','in_review','changes_requested','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists candidate_profile_country_status_idx
  on public.candidate_profile_drafts (country_code, candidate_status, updated_at desc);

alter table public.candidate_profile_drafts enable row level security;
revoke all on public.candidate_profile_drafts from anon, authenticated;
grant select on public.candidate_profile_drafts to authenticated;
grant insert (
  user_id, display_name, candidate_status, pageant_title, primary_goal,
  country_code, country_name, city, region, public_bio, profile_visibility
) on public.candidate_profile_drafts to authenticated;
grant update (
  display_name, candidate_status, pageant_title, primary_goal,
  country_code, country_name, city, region, public_bio, profile_visibility
) on public.candidate_profile_drafts to authenticated;

create policy "Candidates read their draft and admins read all"
on public.candidate_profile_drafts for select to authenticated
using (
  user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

create policy "Candidates create their draft"
on public.candidate_profile_drafts for insert to authenticated
with check (
  user_id = (select auth.uid())
  and review_state = 'pending'
);

create policy "Candidates update their draft"
on public.candidate_profile_drafts for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

alter table public.professional_profile_drafts
  add column if not exists account_type text not null default 'supplier',
  add column if not exists primary_category text,
  add column if not exists additional_categories text[] not null default '{}',
  add column if not exists category_other text,
  add column if not exists country_code text,
  add column if not exists country_name text,
  add column if not exists city text,
  add column if not exists region text;

alter table public.professional_profile_drafts
  drop constraint if exists professional_profile_drafts_account_type_check,
  add constraint professional_profile_drafts_account_type_check
    check (account_type = 'supplier'),
  drop constraint if exists professional_profile_drafts_country_code_check,
  add constraint professional_profile_drafts_country_code_check
    check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  drop constraint if exists professional_profile_drafts_additional_categories_check,
  add constraint professional_profile_drafts_additional_categories_check
    check (cardinality(additional_categories) <= 12),
  drop constraint if exists professional_profile_drafts_category_other_check,
  add constraint professional_profile_drafts_category_other_check
    check (
      not (
        primary_category = 'Other'
        or 'Other' = any(additional_categories)
      )
      or nullif(btrim(category_other), '') is not null
    );

create index if not exists professional_profile_country_category_idx
  on public.professional_profile_drafts (country_code, primary_category, updated_at desc);

grant insert (
  account_type, primary_category, additional_categories, category_other,
  country_code, country_name, city, region
) on public.professional_profile_drafts to authenticated;
grant update (
  account_type, primary_category, additional_categories, category_other,
  country_code, country_name, city, region
) on public.professional_profile_drafts to authenticated;

create table if not exists public.saved_supplier_profiles (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, supplier_id)
);

alter table public.saved_supplier_profiles enable row level security;
revoke all on public.saved_supplier_profiles from anon, authenticated;
grant select, insert, delete on public.saved_supplier_profiles to authenticated;
create policy "Users manage saved suppliers"
on public.saved_supplier_profiles for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create table if not exists public.saved_pageant_events (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

alter table public.saved_pageant_events enable row level security;
revoke all on public.saved_pageant_events from anon, authenticated;
grant select, insert, delete on public.saved_pageant_events to authenticated;
create policy "Users manage saved pageants"
on public.saved_pageant_events for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create or replace function public.pageantindex_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.pageantindex_set_updated_at();

drop trigger if exists candidate_profile_drafts_set_updated_at on public.candidate_profile_drafts;
create trigger candidate_profile_drafts_set_updated_at
before update on public.candidate_profile_drafts
for each row execute function public.pageantindex_set_updated_at();
