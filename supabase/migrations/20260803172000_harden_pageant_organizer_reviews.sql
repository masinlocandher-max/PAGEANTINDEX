-- Harden Pageant Organization ownership, review, publication, roster, and results flows.
-- Apply after 20260803171000_add_pageant_organizers.sql.

alter table public.pageant_organization_drafts
  add column if not exists published_at timestamptz;

alter table public.pageant_edition_drafts
  add column if not exists published_at timestamptz;

alter table public.pageant_experience_requests
  add column if not exists published_at timestamptz;

alter table public.organizer_announcement_requests
  add column if not exists published_announcement_id uuid references public.announcements(id) on delete set null;

alter table public.pageant_candidate_roster_drafts
  add column if not exists is_public boolean not null default false;

alter table public.pageant_experience_requests
  alter column submission_state set default 'submitted';

alter table public.organizer_announcement_requests
  alter column submission_state set default 'submitted';

create or replace function public.pageantindex_is_organizer(owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles
    where user_id = owner_id
      and account_type = 'organizer'
  );
$$;

revoke all on function public.pageantindex_is_organizer(uuid) from public;
grant execute on function public.pageantindex_is_organizer(uuid) to anon, authenticated;

create or replace function public.pageantindex_fill_edition_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  organization_record public.pageant_organization_drafts%rowtype;
begin
  select * into organization_record
  from public.pageant_organization_drafts
  where user_id = new.organizer_user_id;

  if found then
    new.organization_name := coalesce(new.organization_name, organization_record.organization_name);
    new.country_code := coalesce(new.country_code, organization_record.country_code);
    new.country_name := coalesce(new.country_name, organization_record.country_name);
    new.city := coalesce(new.city, organization_record.city);
  end if;
  return new;
end;
$$;

drop trigger if exists pageant_edition_fill_organization on public.pageant_edition_drafts;
create trigger pageant_edition_fill_organization
before insert or update on public.pageant_edition_drafts
for each row execute function public.pageantindex_fill_edition_organization();

-- Organization profiles: owners edit content, administrators control review and publication.
revoke all on public.pageant_organization_drafts from anon, authenticated;
grant select on public.pageant_organization_drafts to authenticated;
grant select (
  organization_name, organization_type, official_url, public_email, bio,
  country_code, country_name, city, region, review_state, published_at
) on public.pageant_organization_drafts to anon;
grant insert (
  user_id, organization_name, organization_type, official_url, public_email,
  bio, country_code, country_name, city, region, submission_state
) on public.pageant_organization_drafts to authenticated;
grant update (
  organization_name, organization_type, official_url, public_email,
  bio, country_code, country_name, city, region, submission_state
) on public.pageant_organization_drafts to authenticated;

drop policy if exists "Organizers read their organization and admins read all" on public.pageant_organization_drafts;
drop policy if exists "Organizers create their organization" on public.pageant_organization_drafts;
drop policy if exists "Organizers update their organization" on public.pageant_organization_drafts;

create policy "Public reads approved pageant organizations"
on public.pageant_organization_drafts for select
using (review_state = 'approved' and published_at is not null);

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
  and public.pageantindex_is_organizer((select auth.uid()))
);

create policy "Organizers update their organization"
on public.pageant_organization_drafts for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and public.pageantindex_is_organizer((select auth.uid()))
);

-- Pageant editions: public reads only administrator-approved, submitted editions.
revoke all on public.pageant_edition_drafts from anon, authenticated;
grant select on public.pageant_edition_drafts to authenticated;
grant select (
  id, organization_name, pageant_name, edition_name, edition_year,
  application_open_at, application_close_at, event_start_at, event_end_at,
  country_code, country_name, city, venue, official_url, application_url,
  rules_url, description, review_state, published_at
) on public.pageant_edition_drafts to anon;
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

drop policy if exists "Organizers and admins read edition drafts" on public.pageant_edition_drafts;
drop policy if exists "Organizers create edition drafts" on public.pageant_edition_drafts;
drop policy if exists "Organizers update edition drafts" on public.pageant_edition_drafts;
drop policy if exists "Organizers delete unpublished edition drafts" on public.pageant_edition_drafts;

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
  and public.pageantindex_is_organizer((select auth.uid()))
);

create policy "Organizers update edition drafts"
on public.pageant_edition_drafts for update to authenticated
using (organizer_user_id = (select auth.uid()))
with check (
  organizer_user_id = (select auth.uid())
  and public.pageantindex_is_organizer((select auth.uid()))
);

create policy "Organizers delete unpublished edition drafts"
on public.pageant_edition_drafts for delete to authenticated
using (organizer_user_id = (select auth.uid()) and review_state <> 'approved');

-- Candidate rosters must belong to an edition owned by the same organizer.
revoke all on public.pageant_candidate_roster_drafts from anon, authenticated;
grant select on public.pageant_candidate_roster_drafts to authenticated;
grant select (
  id, edition_id, candidate_display_name, representation, candidate_number,
  status, title_or_placement, is_public, created_at, updated_at
) on public.pageant_candidate_roster_drafts to anon;
grant insert (
  edition_id, organizer_user_id, candidate_display_name, candidate_user_id,
  representation, candidate_number, status, title_or_placement, is_public
) on public.pageant_candidate_roster_drafts to authenticated;
grant update (
  candidate_display_name, candidate_user_id, representation, candidate_number,
  status, title_or_placement, is_public
) on public.pageant_candidate_roster_drafts to authenticated;
grant delete on public.pageant_candidate_roster_drafts to authenticated;

drop policy if exists "Organizers and admins manage roster drafts" on public.pageant_candidate_roster_drafts;

create policy "Public reads authorized candidates in approved editions"
on public.pageant_candidate_roster_drafts for select
using (
  is_public = true
  and exists (
    select 1 from public.pageant_edition_drafts edition
    where edition.id = edition_id
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
  and public.pageantindex_is_organizer((select auth.uid()))
  and exists (
    select 1 from public.pageant_edition_drafts edition
    where edition.id = edition_id
      and edition.organizer_user_id = (select auth.uid())
  )
);

create policy "Organizers update roster drafts for their editions"
on public.pageant_candidate_roster_drafts for update to authenticated
using (organizer_user_id = (select auth.uid()))
with check (
  organizer_user_id = (select auth.uid())
  and exists (
    select 1 from public.pageant_edition_drafts edition
    where edition.id = edition_id
      and edition.organizer_user_id = (select auth.uid())
  )
);

create policy "Organizers delete roster drafts"
on public.pageant_candidate_roster_drafts for delete to authenticated
using (organizer_user_id = (select auth.uid()));

-- Voting, livestream, PPV, ticket, and merchandise requests.
revoke all on public.pageant_experience_requests from anon, authenticated;
grant select on public.pageant_experience_requests to authenticated;
grant select (
  id, edition_id, experience_type, title, description, guest_access_requested,
  provider_name, provider_url, starts_at, ends_at, review_state, published_at
) on public.pageant_experience_requests to anon;
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

drop policy if exists "Organizers and admins manage experience requests" on public.pageant_experience_requests;

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
  and public.pageantindex_is_organizer((select auth.uid()))
  and exists (
    select 1 from public.pageant_edition_drafts edition
    where edition.id = edition_id
      and edition.organizer_user_id = (select auth.uid())
  )
);

create policy "Organizers update experience requests"
on public.pageant_experience_requests for update to authenticated
using (organizer_user_id = (select auth.uid()))
with check (organizer_user_id = (select auth.uid()));

create policy "Organizers delete unapproved experience requests"
on public.pageant_experience_requests for delete to authenticated
using (organizer_user_id = (select auth.uid()) and review_state <> 'approved');

-- Organizer announcement requests are promoted into the public announcements table by administrators.
revoke all on public.organizer_announcement_requests from anon, authenticated;
grant select on public.organizer_announcement_requests to authenticated;
grant insert (
  organizer_user_id, edition_id, title, summary, target_url, submission_state
) on public.organizer_announcement_requests to authenticated;
grant update (
  edition_id, title, summary, target_url, submission_state
) on public.organizer_announcement_requests to authenticated;
grant delete on public.organizer_announcement_requests to authenticated;

drop policy if exists "Organizers and admins manage announcement requests" on public.organizer_announcement_requests;

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
  and public.pageantindex_is_organizer((select auth.uid()))
  and (
    edition_id is null
    or exists (
      select 1 from public.pageant_edition_drafts edition
      where edition.id = edition_id
        and edition.organizer_user_id = (select auth.uid())
    )
  )
);

create policy "Organizers update announcement requests"
on public.organizer_announcement_requests for update to authenticated
using (organizer_user_id = (select auth.uid()))
with check (organizer_user_id = (select auth.uid()));

create policy "Organizers delete unapproved announcement requests"
on public.organizer_announcement_requests for delete to authenticated
using (organizer_user_id = (select auth.uid()) and review_state <> 'approved');

-- Official results are separate from candidate profiles and require review.
create table if not exists public.pageant_result_drafts (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.pageant_edition_drafts(id) on delete cascade,
  organizer_user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  candidate_display_name text not null check (char_length(candidate_display_name) between 2 and 180),
  representation text check (representation is null or char_length(representation) <= 180),
  award_or_placement text not null check (char_length(award_or_placement) between 2 and 220),
  result_order integer check (result_order is null or result_order between 1 and 10000),
  official_url text check (official_url is null or char_length(official_url) <= 1000),
  submission_state text not null default 'submitted'
    check (submission_state in ('draft','submitted','withdrawn')),
  review_state text not null default 'pending'
    check (review_state in ('pending','in_review','changes_requested','approved','rejected')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pageant_result_drafts_edition_idx
  on public.pageant_result_drafts (edition_id, result_order, updated_at desc);

alter table public.pageant_result_drafts enable row level security;
revoke all on public.pageant_result_drafts from anon, authenticated;
grant select on public.pageant_result_drafts to authenticated;
grant select (
  id, edition_id, candidate_display_name, representation, award_or_placement,
  result_order, official_url, published_at
) on public.pageant_result_drafts to anon;
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
  and public.pageantindex_is_organizer((select auth.uid()))
  and exists (
    select 1 from public.pageant_edition_drafts edition
    where edition.id = edition_id
      and edition.organizer_user_id = (select auth.uid())
  )
);

create policy "Organizers update result drafts"
on public.pageant_result_drafts for update to authenticated
using (organizer_user_id = (select auth.uid()))
with check (organizer_user_id = (select auth.uid()));

create policy "Organizers delete unapproved result drafts"
on public.pageant_result_drafts for delete to authenticated
using (organizer_user_id = (select auth.uid()) and review_state <> 'approved');

drop trigger if exists pageant_result_drafts_set_updated_at on public.pageant_result_drafts;
create trigger pageant_result_drafts_set_updated_at
before update on public.pageant_result_drafts
for each row execute function public.pageantindex_set_updated_at();

-- Administrator-only review functions. Review columns are not owner-writable.
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
  set review_state = next_review_state,
      published_at = case when next_review_state = 'approved' then coalesce(published_at, now()) else null end,
      updated_at = now()
  where user_id = profile_user_id;
end;
$$;

create or replace function public.admin_review_pageant_edition(
  edition_record_id uuid,
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
  update public.pageant_edition_drafts
  set review_state = next_review_state,
      published_at = case when next_review_state = 'approved' then coalesce(published_at, now()) else null end,
      updated_at = now()
  where id = edition_record_id;
end;
$$;

create or replace function public.admin_review_pageant_experience(
  request_record_id uuid,
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
  update public.pageant_experience_requests
  set review_state = next_review_state,
      published_at = case when next_review_state = 'approved' then coalesce(published_at, now()) else null end,
      updated_at = now()
  where id = request_record_id;
end;
$$;

create or replace function public.admin_review_pageant_result(
  result_record_id uuid,
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
  update public.pageant_result_drafts
  set review_state = next_review_state,
      published_at = case when next_review_state = 'approved' then coalesce(published_at, now()) else null end,
      updated_at = now()
  where id = result_record_id;
end;
$$;

create or replace function public.admin_review_organizer_announcement(
  request_record_id uuid,
  next_review_state text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request_record public.organizer_announcement_requests%rowtype;
  announcement_id uuid;
begin
  if coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') <> 'admin' then
    raise exception 'Administrator access required';
  end if;
  if next_review_state not in ('pending','in_review','changes_requested','approved','rejected') then
    raise exception 'Invalid review state';
  end if;

  select * into request_record
  from public.organizer_announcement_requests
  where id = request_record_id
  for update;

  if not found then raise exception 'Announcement request not found'; end if;

  announcement_id := request_record.published_announcement_id;
  if next_review_state = 'approved' then
    if announcement_id is null then
      insert into public.announcements (
        title, summary, category, target_url, status, published_at, created_by
      ) values (
        request_record.title, request_record.summary, 'Official pageant update',
        request_record.target_url, 'published', now(), request_record.organizer_user_id
      ) returning id into announcement_id;
    else
      update public.announcements
      set title = request_record.title,
          summary = request_record.summary,
          target_url = request_record.target_url,
          status = 'published',
          published_at = coalesce(published_at, now()),
          updated_at = now()
      where id = announcement_id;
    end if;
  elsif announcement_id is not null then
    update public.announcements
    set status = 'archived', updated_at = now()
    where id = announcement_id;
  end if;

  update public.organizer_announcement_requests
  set review_state = next_review_state,
      published_announcement_id = announcement_id,
      updated_at = now()
  where id = request_record_id;

  return announcement_id;
end;
$$;

revoke all on function public.admin_review_pageant_organization(uuid, text) from public;
revoke all on function public.admin_review_pageant_edition(uuid, text) from public;
revoke all on function public.admin_review_pageant_experience(uuid, text) from public;
revoke all on function public.admin_review_pageant_result(uuid, text) from public;
revoke all on function public.admin_review_organizer_announcement(uuid, text) from public;

grant execute on function public.admin_review_pageant_organization(uuid, text) to authenticated;
grant execute on function public.admin_review_pageant_edition(uuid, text) to authenticated;
grant execute on function public.admin_review_pageant_experience(uuid, text) to authenticated;
grant execute on function public.admin_review_pageant_result(uuid, text) to authenticated;
grant execute on function public.admin_review_organizer_announcement(uuid, text) to authenticated;
