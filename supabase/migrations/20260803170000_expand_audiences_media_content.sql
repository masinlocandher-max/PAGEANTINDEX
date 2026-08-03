-- Expand Pageant Index from Candidate/Supplier into four audience types.
-- Apply after 20260803164000_global_public_supplier_fields.sql.

alter table public.user_profiles
  drop constraint if exists user_profiles_account_type_check;

alter table public.user_profiles
  add constraint user_profiles_account_type_check
  check (account_type in ('enthusiast','candidate','supplier','media'));

create table if not exists public.enthusiast_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  display_name text not null default '' check (char_length(display_name) <= 160),
  interests text[] not null default '{}',
  email_updates boolean not null default false,
  app_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enthusiast_profiles_interests_check check (cardinality(interests) <= 20)
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

alter table public.candidate_profile_drafts
  add column if not exists current_pageant text,
  add column if not exists current_title text;

alter table public.candidate_profile_drafts
  drop constraint if exists candidate_profile_drafts_current_pageant_check,
  add constraint candidate_profile_drafts_current_pageant_check
    check (current_pageant is null or char_length(current_pageant) <= 180),
  drop constraint if exists candidate_profile_drafts_current_title_check,
  add constraint candidate_profile_drafts_current_title_check
    check (current_title is null or char_length(current_title) <= 180);

grant insert (current_pageant, current_title)
  on public.candidate_profile_drafts to authenticated;
grant update (current_pageant, current_title)
  on public.candidate_profile_drafts to authenticated;

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
  private_notes text check (private_notes is null or char_length(private_notes) <= 4000),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists candidate_pageant_history_user_year_idx
  on public.candidate_pageant_history (user_id, participation_type, year_joined desc);

alter table public.candidate_pageant_history enable row level security;
revoke all on public.candidate_pageant_history from anon, authenticated;
grant select, insert, update, delete on public.candidate_pageant_history to authenticated;
grant select on public.candidate_pageant_history to anon;

create policy "Candidates read their history admins read all and public reads shared records"
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

create table if not exists public.media_profile_drafts (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  column_name text not null default '' check (char_length(column_name) <= 180),
  role text check (role is null or char_length(role) <= 120),
  media_type text check (media_type is null or char_length(media_type) <= 120),
  official_url text check (official_url is null or char_length(official_url) <= 1000),
  bio text check (bio is null or char_length(bio) <= 2500),
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

alter table public.media_profile_drafts enable row level security;
revoke all on public.media_profile_drafts from anon, authenticated;
grant select on public.media_profile_drafts to authenticated;
grant insert (
  user_id, column_name, role, media_type, official_url, bio,
  country_code, country_name, city, region, submission_state
) on public.media_profile_drafts to authenticated;
grant update (
  column_name, role, media_type, official_url, bio,
  country_code, country_name, city, region, submission_state
) on public.media_profile_drafts to authenticated;

create policy "Media owners read their profile and admins read all"
on public.media_profile_drafts for select to authenticated
using (
  user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

create policy "Media owners create their profile"
on public.media_profile_drafts for insert to authenticated
with check (user_id = (select auth.uid()) and review_state = 'pending');

create policy "Media owners update their profile"
on public.media_profile_drafts for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create table if not exists public.media_articles (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 4 and 220),
  excerpt text not null default '' check (char_length(excerpt) <= 500),
  body text not null default '' check (char_length(body) <= 60000),
  cover_url text check (cover_url is null or char_length(cover_url) <= 1000),
  canonical_url text check (canonical_url is null or char_length(canonical_url) <= 1000),
  column_name text check (column_name is null or char_length(column_name) <= 180),
  author_name text check (author_name is null or char_length(author_name) <= 180),
  submission_state text not null default 'draft'
    check (submission_state in ('draft','submitted','withdrawn')),
  review_state text not null default 'pending'
    check (review_state in ('pending','in_review','changes_requested','approved','rejected')),
  is_shareable boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_articles_publication_idx
  on public.media_articles (review_state, published_at desc);
create index if not exists media_articles_author_idx
  on public.media_articles (author_user_id, updated_at desc);

alter table public.media_articles enable row level security;
revoke all on public.media_articles from anon, authenticated;
grant select on public.media_articles to anon, authenticated;
grant insert (
  author_user_id, slug, title, excerpt, body, cover_url, canonical_url,
  column_name, author_name, submission_state, is_shareable
) on public.media_articles to authenticated;
grant update (
  slug, title, excerpt, body, cover_url, canonical_url,
  column_name, author_name, submission_state, is_shareable
) on public.media_articles to authenticated;
grant delete on public.media_articles to authenticated;

create policy "Published media is public"
on public.media_articles for select
using (review_state = 'approved' and published_at is not null);

create policy "Media owners and admins read article drafts"
on public.media_articles for select to authenticated
using (
  author_user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

create policy "Media owners create article drafts"
on public.media_articles for insert to authenticated
with check (
  author_user_id = (select auth.uid())
  and review_state = 'pending'
  and published_at is null
);

create policy "Media owners update article drafts"
on public.media_articles for update to authenticated
using (author_user_id = (select auth.uid()))
with check (author_user_id = (select auth.uid()));

create policy "Media owners delete unpublished drafts"
on public.media_articles for delete to authenticated
using (author_user_id = (select auth.uid()) and published_at is null);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 4 and 220),
  summary text not null default '' check (char_length(summary) <= 1000),
  category text not null default 'Platform update' check (char_length(category) <= 100),
  target_url text check (target_url is null or char_length(target_url) <= 1000),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  is_pinned boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.announcements enable row level security;
revoke all on public.announcements from anon, authenticated;
grant select on public.announcements to anon, authenticated;
grant insert, update, delete on public.announcements to authenticated;

create policy "Published announcements are public"
on public.announcements for select
using (status = 'published' and published_at is not null);

create policy "Admins read all announcements"
on public.announcements for select to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins create announcements"
on public.announcements for insert to authenticated
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins update announcements"
on public.announcements for update to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins delete announcements"
on public.announcements for delete to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create table if not exists public.featured_ads (
  id uuid primary key default gen_random_uuid(),
  label text not null default 'Featured' check (char_length(label) <= 80),
  title text not null check (char_length(title) between 4 and 220),
  summary text not null default '' check (char_length(summary) <= 1000),
  image_url text check (image_url is null or char_length(image_url) <= 1000),
  target_url text check (target_url is null or char_length(target_url) <= 1000),
  placement text not null default 'network' check (char_length(placement) <= 80),
  audience_types text[] not null default array['enthusiast','candidate','supplier','media'],
  priority integer not null default 0 check (priority between -1000 and 1000),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists featured_ads_active_idx
  on public.featured_ads (status, priority desc, starts_at, ends_at);

alter table public.featured_ads enable row level security;
revoke all on public.featured_ads from anon, authenticated;
grant select on public.featured_ads to anon, authenticated;
grant insert, update, delete on public.featured_ads to authenticated;

create policy "Active featured ads are public"
on public.featured_ads for select
using (
  status = 'published'
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);

create policy "Admins read all featured ads"
on public.featured_ads for select to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins create featured ads"
on public.featured_ads for insert to authenticated
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins update featured ads"
on public.featured_ads for update to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins delete featured ads"
on public.featured_ads for delete to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create or replace function public.admin_review_media_article(
  article_id uuid,
  next_review_state text,
  publish_now boolean default false
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
  update public.media_articles
  set review_state = next_review_state,
      published_at = case
        when next_review_state = 'approved' and publish_now then coalesce(published_at, now())
        when next_review_state <> 'approved' then null
        else published_at
      end,
      updated_at = now()
  where id = article_id;
end;
$$;

revoke all on function public.admin_review_media_article(uuid, text, boolean) from public;
grant execute on function public.admin_review_media_article(uuid, text, boolean) to authenticated;

create or replace function public.admin_review_media_profile(
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
  update public.media_profile_drafts
  set review_state = next_review_state, updated_at = now()
  where user_id = profile_user_id;
end;
$$;

revoke all on function public.admin_review_media_profile(uuid, text) from public;
grant execute on function public.admin_review_media_profile(uuid, text) to authenticated;

drop trigger if exists enthusiast_profiles_set_updated_at on public.enthusiast_profiles;
create trigger enthusiast_profiles_set_updated_at
before update on public.enthusiast_profiles
for each row execute function public.pageantindex_set_updated_at();

drop trigger if exists candidate_pageant_history_set_updated_at on public.candidate_pageant_history;
create trigger candidate_pageant_history_set_updated_at
before update on public.candidate_pageant_history
for each row execute function public.pageantindex_set_updated_at();

drop trigger if exists media_profile_drafts_set_updated_at on public.media_profile_drafts;
create trigger media_profile_drafts_set_updated_at
before update on public.media_profile_drafts
for each row execute function public.pageantindex_set_updated_at();

drop trigger if exists media_articles_set_updated_at on public.media_articles;
create trigger media_articles_set_updated_at
before update on public.media_articles
for each row execute function public.pageantindex_set_updated_at();

drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at
before update on public.announcements
for each row execute function public.pageantindex_set_updated_at();

drop trigger if exists featured_ads_set_updated_at on public.featured_ads;
create trigger featured_ads_set_updated_at
before update on public.featured_ads
for each row execute function public.pageantindex_set_updated_at();
