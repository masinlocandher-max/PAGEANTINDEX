-- Live PageantIndex organization operations migration.
-- Mirrors Supabase migration 20260803172919.

create table if not exists public.pageant_candidate_roster_drafts (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.pageant_edition_drafts(id) on delete cascade,
  organizer_user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  candidate_display_name text not null
    check (char_length(candidate_display_name) between 2 and 180),
  representation text
    check (representation is null or char_length(representation) <= 180),
  candidate_number text
    check (candidate_number is null or char_length(candidate_number) <= 40),
  status text not null default 'draft'
    check (status in ('draft','confirmed','withdrawn','disqualified','completed')),
  title_or_placement text
    check (title_or_placement is null or char_length(title_or_placement) <= 220),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pageant_roster_edition_idx
  on public.pageant_candidate_roster_drafts
  (edition_id, status, candidate_number);

alter table public.pageant_candidate_roster_drafts enable row level security;
revoke all on public.pageant_candidate_roster_drafts from anon, authenticated;
grant select (
  id, edition_id, candidate_display_name, representation, candidate_number,
  status, title_or_placement, is_public, created_at, updated_at
) on public.pageant_candidate_roster_drafts to anon;
grant select on public.pageant_candidate_roster_drafts to authenticated;
grant insert (
  edition_id, organizer_user_id, candidate_display_name, representation,
  candidate_number, status, title_or_placement, is_public
) on public.pageant_candidate_roster_drafts to authenticated;
grant update (
  candidate_display_name, representation, candidate_number,
  status, title_or_placement, is_public
) on public.pageant_candidate_roster_drafts to authenticated;
grant delete on public.pageant_candidate_roster_drafts to authenticated;

create policy "Public reads authorized candidates in approved editions"
on public.pageant_candidate_roster_drafts for select
using (
  is_public = true
  and exists (
    select 1
    from public.pageant_edition_drafts edition
    where edition.id = pageant_candidate_roster_drafts.edition_id
      and edition.review_state = 'approved'
      and edition.submission_state = 'submitted'
      and edition.published_at is not null
  )
);
create policy "Organizers and admins read roster drafts"
on public.pageant_candidate_roster_drafts for select to authenticated
using (
  organizer_user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);
create policy "Organizers create roster drafts for their editions"
on public.pageant_candidate_roster_drafts for insert to authenticated
with check (
  organizer_user_id = (select auth.uid())
  and (select public.pageantindex_is_organizer())
  and exists (
    select 1
    from public.pageant_edition_drafts edition
    where edition.id = pageant_candidate_roster_drafts.edition_id
      and edition.organizer_user_id = (select auth.uid())
  )
);
create policy "Organizers update roster drafts for their editions"
on public.pageant_candidate_roster_drafts for update to authenticated
using (organizer_user_id = (select auth.uid()))
with check (
  organizer_user_id = (select auth.uid())
  and exists (
    select 1
    from public.pageant_edition_drafts edition
    where edition.id = pageant_candidate_roster_drafts.edition_id
      and edition.organizer_user_id = (select auth.uid())
  )
);
create policy "Organizers delete roster drafts"
on public.pageant_candidate_roster_drafts for delete to authenticated
using (organizer_user_id = (select auth.uid()));

create trigger pageant_candidate_roster_drafts_set_updated_at
before update on public.pageant_candidate_roster_drafts
for each row execute function public.pageantindex_set_updated_at();

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
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pageant_experience_public_idx
  on public.pageant_experience_requests
  (review_state, published_at desc, starts_at);

alter table public.pageant_experience_requests enable row level security;
revoke all on public.pageant_experience_requests from anon, authenticated;
grant select (
  id, edition_id, experience_type, title, description, guest_access_requested,
  provider_name, provider_url, starts_at, ends_at,
  submission_state, review_state, published_at
) on public.pageant_experience_requests to anon;
grant select on public.pageant_experience_requests to authenticated;
grant insert (
  edition_id, organizer_user_id, experience_type, title, description,
  guest_access_requested, provider_name, provider_url, starts_at, ends_at,
  submission_state
) on public.pageant_experience_requests to authenticated;
grant update (
  experience_type, title, description, guest_access_requested,
  provider_name, provider_url, starts_at, ends_at, submission_state
) on public.pageant_experience_requests to authenticated;
grant delete on public.pageant_experience_requests to authenticated;

create policy "Public reads approved pageant experiences"
on public.pageant_experience_requests for select
using (
  review_state = 'approved'
  and submission_state = 'submitted'
  and published_at is not null
);
create policy "Organizers and admins read experience requests"
on public.pageant_experience_requests for select to authenticated
using (
  organizer_user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);
create policy "Organizers create experience requests for their editions"
on public.pageant_experience_requests for insert to authenticated
with check (
  organizer_user_id = (select auth.uid())
  and review_state = 'pending'
  and published_at is null
  and (select public.pageantindex_is_organizer())
  and exists (
    select 1
    from public.pageant_edition_drafts edition
    where edition.id = pageant_experience_requests.edition_id
      and edition.organizer_user_id = (select auth.uid())
  )
);
create policy "Organizers update experience requests"
on public.pageant_experience_requests for update to authenticated
using (organizer_user_id = (select auth.uid()))
with check (
  organizer_user_id = (select auth.uid())
  and exists (
    select 1
    from public.pageant_edition_drafts edition
    where edition.id = pageant_experience_requests.edition_id
      and edition.organizer_user_id = (select auth.uid())
  )
);
create policy "Organizers delete unapproved experience requests"
on public.pageant_experience_requests for delete to authenticated
using (
  organizer_user_id = (select auth.uid())
  and review_state <> 'approved'
);

create trigger pageant_experience_requests_set_updated_at
before update on public.pageant_experience_requests
for each row execute function public.pageantindex_set_updated_at();

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
  published_announcement_id uuid
    references public.announcements(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizer_announcement_requests enable row level security;
revoke all on public.organizer_announcement_requests from anon, authenticated;
grant select on public.organizer_announcement_requests to authenticated;
grant insert (
  organizer_user_id, edition_id, title, summary, target_url, submission_state
) on public.organizer_announcement_requests to authenticated;
grant update (
  edition_id, title, summary, target_url, submission_state
) on public.organizer_announcement_requests to authenticated;
grant delete on public.organizer_announcement_requests to authenticated;

create policy "Organizers and admins read announcement requests"
on public.organizer_announcement_requests for select to authenticated
using (
  organizer_user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);
create policy "Organizers create announcement requests"
on public.organizer_announcement_requests for insert to authenticated
with check (
  organizer_user_id = (select auth.uid())
  and review_state = 'pending'
  and (select public.pageantindex_is_organizer())
  and (
    edition_id is null
    or exists (
      select 1
      from public.pageant_edition_drafts edition
      where edition.id = organizer_announcement_requests.edition_id
        and edition.organizer_user_id = (select auth.uid())
    )
  )
);
create policy "Organizers update announcement requests"
on public.organizer_announcement_requests for update to authenticated
using (organizer_user_id = (select auth.uid()))
with check (
  organizer_user_id = (select auth.uid())
  and (
    edition_id is null
    or exists (
      select 1
      from public.pageant_edition_drafts edition
      where edition.id = organizer_announcement_requests.edition_id
        and edition.organizer_user_id = (select auth.uid())
    )
  )
);
create policy "Organizers delete unapproved announcement requests"
on public.organizer_announcement_requests for delete to authenticated
using (
  organizer_user_id = (select auth.uid())
  and review_state <> 'approved'
);

create trigger organizer_announcement_requests_set_updated_at
before update on public.organizer_announcement_requests
for each row execute function public.pageantindex_set_updated_at();

create table if not exists public.pageant_result_drafts (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.pageant_edition_drafts(id) on delete cascade,
  organizer_user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  candidate_display_name text not null
    check (char_length(candidate_display_name) between 2 and 180),
  representation text
    check (representation is null or char_length(representation) <= 180),
  award_or_placement text not null
    check (char_length(award_or_placement) between 2 and 220),
  result_order integer
    check (result_order is null or result_order between 1 and 10000),
  official_url text check (official_url is null or char_length(official_url) <= 1000),
  submission_state text not null default 'draft'
    check (submission_state in ('draft','submitted','withdrawn')),
  review_state text not null default 'pending'
    check (review_state in ('pending','in_review','changes_requested','approved','rejected')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pageant_result_drafts_edition_idx
  on public.pageant_result_drafts
  (edition_id, result_order, updated_at desc);

alter table public.pageant_result_drafts enable row level security;
revoke all on public.pageant_result_drafts from anon, authenticated;
grant select (
  id, edition_id, candidate_display_name, representation, award_or_placement,
  result_order, official_url, submission_state, review_state, published_at
) on public.pageant_result_drafts to anon;
grant select on public.pageant_result_drafts to authenticated;
grant insert (
  edition_id, organizer_user_id, candidate_display_name, representation,
  award_or_placement, result_order, official_url, submission_state
) on public.pageant_result_drafts to authenticated;
grant update (
  candidate_display_name, representation, award_or_placement,
  result_order, official_url, submission_state
) on public.pageant_result_drafts to authenticated;
grant delete on public.pageant_result_drafts to authenticated;

create policy "Public reads approved official results"
on public.pageant_result_drafts for select
using (
  review_state = 'approved'
  and submission_state = 'submitted'
  and published_at is not null
);
create policy "Organizers and admins read result drafts"
on public.pageant_result_drafts for select to authenticated
using (
  organizer_user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);
create policy "Organizers create results for their editions"
on public.pageant_result_drafts for insert to authenticated
with check (
  organizer_user_id = (select auth.uid())
  and review_state = 'pending'
  and published_at is null
  and (select public.pageantindex_is_organizer())
  and exists (
    select 1
    from public.pageant_edition_drafts edition
    where edition.id = pageant_result_drafts.edition_id
      and edition.organizer_user_id = (select auth.uid())
  )
);
create policy "Organizers update result drafts"
on public.pageant_result_drafts for update to authenticated
using (organizer_user_id = (select auth.uid()))
with check (
  organizer_user_id = (select auth.uid())
  and exists (
    select 1
    from public.pageant_edition_drafts edition
    where edition.id = pageant_result_drafts.edition_id
      and edition.organizer_user_id = (select auth.uid())
  )
);
create policy "Organizers delete unapproved result drafts"
on public.pageant_result_drafts for delete to authenticated
using (
  organizer_user_id = (select auth.uid())
  and review_state <> 'approved'
);

create trigger pageant_result_drafts_set_updated_at
before update on public.pageant_result_drafts
for each row execute function public.pageantindex_set_updated_at();

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
  event_id uuid not null references public.pageant_edition_drafts(id) on delete cascade,
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
