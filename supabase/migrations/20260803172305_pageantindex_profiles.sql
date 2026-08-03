-- Live PageantIndex audience profile migration.
-- Mirrors Supabase migration 20260803172305.

create table if not exists public.enthusiast_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  display_name text not null default '' check (char_length(display_name) <= 160),
  interests text[] not null default '{}'
    check (cardinality(interests) <= 20),
  email_updates boolean not null default false,
  app_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.enthusiast_profiles enable row level security;
revoke all on public.enthusiast_profiles from anon, authenticated;
grant select on public.enthusiast_profiles to authenticated;
grant insert (user_id, display_name, interests, email_updates, app_notifications)
  on public.enthusiast_profiles to authenticated;
grant update (display_name, interests, email_updates, app_notifications)
  on public.enthusiast_profiles to authenticated;

create policy "Enthusiasts read their preferences and admins read all"
on public.enthusiast_profiles for select to authenticated
using (
  user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);
create policy "Enthusiasts create their preferences"
on public.enthusiast_profiles for insert to authenticated
with check (user_id = (select auth.uid()));
create policy "Enthusiasts update their preferences"
on public.enthusiast_profiles for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create trigger enthusiast_profiles_set_updated_at
before update on public.enthusiast_profiles
for each row execute function public.pageantindex_set_updated_at();

create table if not exists public.candidate_profile_drafts (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  display_name text not null default '' check (char_length(display_name) <= 160),
  candidate_status text check (
    candidate_status is null or candidate_status in (
      'Aspiring candidate','Current candidate','Titleholder',
      'Former candidate or titleholder'
    )
  ),
  pageant_title text check (pageant_title is null or char_length(pageant_title) <= 180),
  current_pageant text check (current_pageant is null or char_length(current_pageant) <= 180),
  current_title text check (current_title is null or char_length(current_title) <= 180),
  primary_goal text check (
    primary_goal is null or primary_goal in (
      'Find suppliers','Track my current and previous pageants','Find pageants',
      'Build my candidate profile','Find flights or hotels',
      'Find sponsors or opportunities'
    )
  ),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  country_name text check (country_name is null or char_length(country_name) <= 120),
  city text check (city is null or char_length(city) <= 100),
  region text check (region is null or char_length(region) <= 120),
  public_bio text check (public_bio is null or char_length(public_bio) <= 3000),
  profile_visibility text not null default 'private'
    check (profile_visibility in ('private','review','published')),
  review_state text not null default 'pending'
    check (review_state in ('pending','in_review','changes_requested','approved','rejected')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index candidate_profile_country_status_idx
  on public.candidate_profile_drafts
  (country_code, candidate_status, updated_at desc);

alter table public.candidate_profile_drafts enable row level security;
revoke all on public.candidate_profile_drafts from anon, authenticated;
grant select on public.candidate_profile_drafts to authenticated;
grant insert (
  user_id, display_name, candidate_status, pageant_title, current_pageant,
  current_title, primary_goal, country_code, country_name, city, region,
  public_bio, profile_visibility
) on public.candidate_profile_drafts to authenticated;
grant update (
  display_name, candidate_status, pageant_title, current_pageant,
  current_title, primary_goal, country_code, country_name, city, region,
  public_bio, profile_visibility
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
  and published_at is null
);
create policy "Candidates update their draft"
on public.candidate_profile_drafts for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create trigger candidate_profile_drafts_set_updated_at
before update on public.candidate_profile_drafts
for each row execute function public.pageantindex_set_updated_at();

create table if not exists public.candidate_pageant_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  pageant_name text not null check (char_length(pageant_name) between 2 and 220),
  year_joined integer check (year_joined is null or year_joined between 1900 and 2100),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  country_name text check (country_name is null or char_length(country_name) <= 120),
  title_or_placement text check (title_or_placement is null or char_length(title_or_placement) <= 220),
  participation_type text not null default 'previous'
    check (participation_type in ('current','previous')),
  official_url text check (official_url is null or char_length(official_url) <= 1000),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index candidate_pageant_history_user_year_idx
  on public.candidate_pageant_history
  (user_id, participation_type, year_joined desc);

alter table public.candidate_pageant_history enable row level security;
revoke all on public.candidate_pageant_history from anon, authenticated;
grant select (id, pageant_name, year_joined, country_code, country_name,
  title_or_placement, participation_type, official_url, is_public,
  created_at, updated_at)
  on public.candidate_pageant_history to anon;
grant select on public.candidate_pageant_history to authenticated;
grant insert (
  user_id, pageant_name, year_joined, country_code, country_name,
  title_or_placement, participation_type, official_url, is_public
) on public.candidate_pageant_history to authenticated;
grant update (
  pageant_name, year_joined, country_code, country_name,
  title_or_placement, participation_type, official_url, is_public
) on public.candidate_pageant_history to authenticated;
grant delete on public.candidate_pageant_history to authenticated;

create policy
  "Candidates read their history admins read all and public reads shared records"
on public.candidate_pageant_history for select
using (
  is_public = true
  or user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);
create policy "Candidates create their history"
on public.candidate_pageant_history for insert to authenticated
with check (user_id = (select auth.uid()));
create policy "Candidates update their history"
on public.candidate_pageant_history for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy "Candidates delete their history"
on public.candidate_pageant_history for delete to authenticated
using (user_id = (select auth.uid()));

create trigger candidate_pageant_history_set_updated_at
before update on public.candidate_pageant_history
for each row execute function public.pageantindex_set_updated_at();

create table if not exists public.professional_profile_drafts (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  business_name text not null default '' check (char_length(business_name) <= 160),
  category text check (category is null or char_length(category) <= 120),
  primary_category text,
  additional_categories text[] not null default '{}'
    check (cardinality(additional_categories) <= 12),
  category_other text,
  location text check (location is null or char_length(location) <= 180),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  country_name text check (country_name is null or char_length(country_name) <= 120),
  city text check (city is null or char_length(city) <= 100),
  region text check (region is null or char_length(region) <= 120),
  public_email text check (public_email is null or char_length(public_email) <= 320),
  about text check (about is null or char_length(about) <= 5000),
  services text check (services is null or char_length(services) <= 5000),
  coverage text check (coverage is null or char_length(coverage) <= 120),
  official_link text check (official_link is null or char_length(official_link) <= 2048),
  portfolio_manifest jsonb not null default '[]'::jsonb check (
    jsonb_typeof(portfolio_manifest) = 'array'
    and octet_length(portfolio_manifest::text) <= 131072
  ),
  account_type text not null default 'supplier' check (account_type = 'supplier'),
  submission_state text not null default 'draft'
    check (submission_state in ('draft','submitted','withdrawn')),
  review_state text not null default 'pending'
    check (review_state in ('pending','in_review','changes_requested','approved','rejected')),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint professional_profile_drafts_category_other_check
    check (
      not (
        primary_category = 'Other'
        or 'Other' = any(additional_categories)
      )
      or nullif(btrim(category_other), '') is not null
    )
);

create index professional_profile_country_category_idx
  on public.professional_profile_drafts
  (country_code, primary_category, updated_at desc);

create or replace function public.prepare_professional_profile_draft()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  if new.submission_state = 'submitted'
    and (tg_op = 'INSERT' or old.submission_state is distinct from 'submitted') then
    new.submitted_at = now();
  elsif new.submission_state <> 'submitted' then
    new.submitted_at = null;
  end if;
  return new;
end;
$$;

revoke all on function public.prepare_professional_profile_draft() from public;
grant execute on function public.prepare_professional_profile_draft() to authenticated;

create trigger professional_profile_drafts_prepare
before insert or update on public.professional_profile_drafts
for each row execute function public.prepare_professional_profile_draft();

alter table public.professional_profile_drafts enable row level security;
revoke all on public.professional_profile_drafts from anon, authenticated;
grant select on public.professional_profile_drafts to authenticated;
grant insert (
  user_id, business_name, category, primary_category, additional_categories,
  category_other, location, country_code, country_name, city, region,
  public_email, about, services, coverage, official_link,
  portfolio_manifest, account_type, submission_state
) on public.professional_profile_drafts to authenticated;
grant update (
  business_name, category, primary_category, additional_categories,
  category_other, location, country_code, country_name, city, region,
  public_email, about, services, coverage, official_link,
  portfolio_manifest, submission_state
) on public.professional_profile_drafts to authenticated;

create policy "Professionals read their own draft"
on public.professional_profile_drafts for select to authenticated
using (
  user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);
create policy "Professionals create their own draft"
on public.professional_profile_drafts for insert to authenticated
with check (
  user_id = (select auth.uid())
  and review_state = 'pending'
);
create policy "Professionals update their own draft"
on public.professional_profile_drafts for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
) values (
  'pageant-profile-drafts',
  'pageant-profile-drafts',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Professionals upload their own draft assets"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'pageant-profile-drafts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "Professionals read their own draft assets"
on storage.objects for select to authenticated
using (
  bucket_id = 'pageant-profile-drafts'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  )
);
create policy "Professionals update their own draft assets"
on storage.objects for update to authenticated
using (
  bucket_id = 'pageant-profile-drafts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'pageant-profile-drafts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "Professionals delete their own draft assets"
on storage.objects for delete to authenticated
using (
  bucket_id = 'pageant-profile-drafts'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  )
);
