-- Remove the initial organizer moderation helpers before the hardened versions are created.
-- Apply after 20260803171500_admin_moderation_extensions.sql.

drop function if exists public.admin_review_pageant_edition(uuid, text);
drop function if exists public.admin_review_pageant_experience(uuid, text);
