-- Supabase migration-history marker.
-- Anonymous execution is already revoked in
-- 20260803173041_pageantindex_admin_functions.sql for clean installations.

revoke all on function public.admin_review_media_profile(uuid, text) from anon;
revoke all on function public.admin_review_media_article(uuid, text, boolean) from anon;
revoke all on function public.admin_review_pageant_organization(uuid, text) from anon;
revoke all on function public.admin_review_pageant_edition(uuid, text) from anon;
revoke all on function public.admin_review_pageant_experience(uuid, text) from anon;
revoke all on function public.admin_review_pageant_result(uuid, text) from anon;
revoke all on function public.admin_review_organizer_announcement(uuid, text, boolean) from anon;
