-- Require an auditable privacy acknowledgement before a non-admin account can create a member profile.

DROP POLICY IF EXISTS "Professionals create their own draft" ON public.professional_profile_drafts;
CREATE POLICY "Professionals create their own draft"
ON public.professional_profile_drafts
FOR INSERT TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND review_state = 'pending'
  AND (
    EXISTS (
      SELECT 1 FROM public.member_privacy_acknowledgements a
      WHERE a.user_id = (SELECT auth.uid())
    )
    OR (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  )
);

DROP POLICY IF EXISTS "Candidates create their draft" ON public.candidate_profile_drafts;
CREATE POLICY "Candidates create their draft"
ON public.candidate_profile_drafts
FOR INSERT TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND review_state = 'pending'
  AND published_at IS NULL
  AND (
    EXISTS (
      SELECT 1 FROM public.member_privacy_acknowledgements a
      WHERE a.user_id = (SELECT auth.uid())
    )
    OR (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  )
);

DROP POLICY IF EXISTS "Media owners create their profile" ON public.media_profile_drafts;
CREATE POLICY "Media owners create their profile"
ON public.media_profile_drafts
FOR INSERT TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND review_state = 'pending'
  AND published_at IS NULL
  AND (
    EXISTS (
      SELECT 1 FROM public.member_privacy_acknowledgements a
      WHERE a.user_id = (SELECT auth.uid())
    )
    OR (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  )
);

DROP POLICY IF EXISTS "Organizers create their organization" ON public.pageant_organization_drafts;
CREATE POLICY "Organizers create their organization"
ON public.pageant_organization_drafts
FOR INSERT TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND review_state = 'pending'
  AND published_at IS NULL
  AND (SELECT public.pageantindex_is_organizer())
  AND (
    EXISTS (
      SELECT 1 FROM public.member_privacy_acknowledgements a
      WHERE a.user_id = (SELECT auth.uid())
    )
    OR (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  )
);

DROP POLICY IF EXISTS "Enthusiasts create their preferences" ON public.enthusiast_profiles;
CREATE POLICY "Enthusiasts create their preferences"
ON public.enthusiast_profiles
FOR INSERT TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND (
    EXISTS (
      SELECT 1 FROM public.member_privacy_acknowledgements a
      WHERE a.user_id = (SELECT auth.uid())
    )
    OR (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  )
);

DROP POLICY IF EXISTS "Users create their profile" ON public.user_profiles;
CREATE POLICY "Users create their profile"
ON public.user_profiles
FOR INSERT TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND (
    EXISTS (
      SELECT 1 FROM public.member_privacy_acknowledgements a
      WHERE a.user_id = (SELECT auth.uid())
    )
    OR (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  )
);
