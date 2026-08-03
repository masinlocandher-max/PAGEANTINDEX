-- Allow PostgREST to filter and order approved public pageant records without exposing owner-only fields.
-- Apply after 20260803172000_harden_pageant_organizer_reviews.sql.

grant select (submission_state, review_state)
  on public.pageant_edition_drafts to anon;

grant select (submission_state, review_state, created_at)
  on public.pageant_experience_requests to anon;

grant select (submission_state, review_state)
  on public.pageant_result_drafts to anon;
