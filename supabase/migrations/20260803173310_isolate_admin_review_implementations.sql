-- Supabase migration-history marker.
-- The privileged review implementation is already isolated in the private
-- schema by 20260803173041_pageantindex_admin_functions.sql.

comment on function private.pageantindex_admin_review(text, uuid, text, boolean)
is 'Privileged PageantIndex review implementation. Not exposed through the public Data API.';
