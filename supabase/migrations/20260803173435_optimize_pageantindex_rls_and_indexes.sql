-- Live PageantIndex RLS and foreign-key index optimization.
-- Mirrors Supabase migration 20260803173435.

create index if not exists announcements_created_by_idx
  on public.announcements (created_by);
create index if not exists featured_ads_created_by_idx
  on public.featured_ads (created_by);
create index if not exists intake_submissions_submitted_by_idx
  on public.intake_submissions (submitted_by);
create index if not exists intake_submissions_reviewed_by_idx
  on public.intake_submissions (reviewed_by);
create index if not exists organizer_announcements_edition_idx
  on public.organizer_announcement_requests (edition_id);
create index if not exists organizer_announcements_owner_idx
  on public.organizer_announcement_requests (organizer_user_id);
create index if not exists organizer_announcements_published_idx
  on public.organizer_announcement_requests (published_announcement_id);
create index if not exists pageant_roster_organizer_idx
  on public.pageant_candidate_roster_drafts (organizer_user_id);
create index if not exists pageant_experience_edition_idx
  on public.pageant_experience_requests (edition_id);
create index if not exists pageant_experience_organizer_idx
  on public.pageant_experience_requests (organizer_user_id);
create index if not exists pageant_result_organizer_idx
  on public.pageant_result_drafts (organizer_user_id);
create index if not exists saved_pageant_events_event_idx
  on public.saved_pageant_events (event_id);
create index if not exists saved_supplier_profiles_supplier_idx
  on public.saved_supplier_profiles (supplier_id);

-- Keep one SELECT policy per role and table to avoid repeated permissive-policy
-- evaluation while preserving public, owner, and administrator visibility.

drop policy if exists "Published announcements are public" on public.announcements;
drop policy if exists "Admins read all announcements" on public.announcements;
create policy "Published announcements are public"
on public.announcements for select to anon
using (status = 'published' and published_at is not null);
create policy "Authenticated users read announcements"
on public.announcements for select to authenticated
using (
  (status = 'published' and published_at is not null)
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Active featured ads are public" on public.featured_ads;
drop policy if exists "Admins read all featured ads" on public.featured_ads;
create policy "Active featured ads are public"
on public.featured_ads for select to anon
using (
  status = 'published'
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);
create policy "Authenticated users read featured ads"
on public.featured_ads for select to authenticated
using (
  (
    status = 'published'
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  )
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Published media is public" on public.media_articles;
drop policy if exists "Media owners and admins read article drafts"
  on public.media_articles;
create policy "Published media is public"
on public.media_articles for select to anon
using (
  review_state = 'approved'
  and submission_state = 'submitted'
  and published_at is not null
);
create policy "Authenticated users read media articles"
on public.media_articles for select to authenticated
using (
  (
    review_state = 'approved'
    and submission_state = 'submitted'
    and published_at is not null
  )
  or author_user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Public reads approved pageant organizations"
  on public.pageant_organization_drafts;
drop policy if exists "Organizers read their organization and admins read all"
  on public.pageant_organization_drafts;
create policy "Public reads approved pageant organizations"
on public.pageant_organization_drafts for select to anon
using (
  review_state = 'approved'
  and submission_state = 'submitted'
  and published_at is not null
);
create policy "Authenticated users read pageant organizations"
on public.pageant_organization_drafts for select to authenticated
using (
  (
    review_state = 'approved'
    and submission_state = 'submitted'
    and published_at is not null
  )
  or user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Public reads approved pageant editions"
  on public.pageant_edition_drafts;
drop policy if exists "Organizers and admins read edition drafts"
  on public.pageant_edition_drafts;
create policy "Public reads approved pageant editions"
on public.pageant_edition_drafts for select to anon
using (
  review_state = 'approved'
  and submission_state = 'submitted'
  and published_at is not null
);
create policy "Authenticated users read pageant editions"
on public.pageant_edition_drafts for select to authenticated
using (
  (
    review_state = 'approved'
    and submission_state = 'submitted'
    and published_at is not null
  )
  or organizer_user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Public reads authorized candidates in approved editions"
  on public.pageant_candidate_roster_drafts;
drop policy if exists "Organizers and admins read roster drafts"
  on public.pageant_candidate_roster_drafts;
create policy "Public reads authorized candidates in approved editions"
on public.pageant_candidate_roster_drafts for select to anon
using (
  is_public = true
  and exists (
    select 1 from public.pageant_edition_drafts edition
    where edition.id = pageant_candidate_roster_drafts.edition_id
      and edition.review_state = 'approved'
      and edition.submission_state = 'submitted'
      and edition.published_at is not null
  )
);
create policy "Authenticated users read candidate rosters"
on public.pageant_candidate_roster_drafts for select to authenticated
using (
  (
    is_public = true
    and exists (
      select 1 from public.pageant_edition_drafts edition
      where edition.id = pageant_candidate_roster_drafts.edition_id
        and edition.review_state = 'approved'
        and edition.submission_state = 'submitted'
        and edition.published_at is not null
    )
  )
  or organizer_user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Public reads approved pageant experiences"
  on public.pageant_experience_requests;
drop policy if exists "Organizers and admins read experience requests"
  on public.pageant_experience_requests;
create policy "Public reads approved pageant experiences"
on public.pageant_experience_requests for select to anon
using (
  review_state = 'approved'
  and submission_state = 'submitted'
  and published_at is not null
);
create policy "Authenticated users read pageant experiences"
on public.pageant_experience_requests for select to authenticated
using (
  (
    review_state = 'approved'
    and submission_state = 'submitted'
    and published_at is not null
  )
  or organizer_user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Public reads approved official results"
  on public.pageant_result_drafts;
drop policy if exists "Organizers and admins read result drafts"
  on public.pageant_result_drafts;
create policy "Public reads approved official results"
on public.pageant_result_drafts for select to anon
using (
  review_state = 'approved'
  and submission_state = 'submitted'
  and published_at is not null
);
create policy "Authenticated users read official results"
on public.pageant_result_drafts for select to authenticated
using (
  (
    review_state = 'approved'
    and submission_state = 'submitted'
    and published_at is not null
  )
  or organizer_user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);
