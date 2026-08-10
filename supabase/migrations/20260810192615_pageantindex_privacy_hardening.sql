-- PageantIndex privacy and least-privilege hardening

-- 1) Remove broad anonymous grants inherited by operational tables/views.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;

-- Public read surfaces: grant only the columns intentionally published.
GRANT SELECT (id,title,summary,category,target_url,status,is_pinned,published_at,created_at,updated_at)
  ON public.announcements TO anon;
GRANT SELECT (id,pageant_name,year_joined,country_code,country_name,title_or_placement,participation_type,official_url,is_public,created_at,updated_at)
  ON public.candidate_pageant_history TO anon;
GRANT SELECT (id,edition_id,offer_type,name,description,price_minor,currency,inventory_limit,sale_starts_at,sale_ends_at,status,review_state,published_at,created_at,updated_at)
  ON public.commerce_offers TO anon;
GRANT SELECT (id,label,title,summary,image_url,target_url,placement,audience_types,priority,status,starts_at,ends_at,created_at,updated_at)
  ON public.featured_ads TO anon;
GRANT SELECT (id,slug,title,excerpt,body,cover_url,canonical_url,column_name,author_name,submission_state,review_state,is_shareable,published_at,created_at,updated_at)
  ON public.media_articles TO anon;
GRANT SELECT (id,edition_id,candidate_display_name,representation,candidate_number,status,title_or_placement,is_public,created_at,updated_at)
  ON public.pageant_candidate_roster_drafts TO anon;
GRANT SELECT (id,organization_name,pageant_name,edition_name,edition_year,application_open_at,application_close_at,event_start_at,event_end_at,country_code,country_name,city,venue,official_url,application_url,rules_url,description,submission_state,review_state,published_at,created_at,updated_at)
  ON public.pageant_edition_drafts TO anon;
GRANT SELECT (id,edition_id,experience_type,title,description,guest_access_requested,provider_name,provider_url,starts_at,ends_at,submission_state,review_state,published_at,created_at,updated_at)
  ON public.pageant_experience_requests TO anon;
GRANT SELECT (organization_name,organization_type,official_url,public_email,bio,country_code,country_name,city,region,submission_state,review_state,published_at,created_at,updated_at)
  ON public.pageant_organization_drafts TO anon;
GRANT SELECT (id,edition_id,candidate_display_name,representation,award_or_placement,result_order,official_url,submission_state,review_state,published_at,created_at,updated_at)
  ON public.pageant_result_drafts TO anon;
GRANT SELECT (id,edition_id,candidate_roster_id,role,credit_scope,status,confirmed_at,created_at,updated_at)
  ON public.professional_credits TO anon;
GRANT SELECT (id,slug,public_name,category,location,city,headline,biography,public_email,mobile,website_url,social_url,logo_url,cover_url,services,years_experience,accepts_nationwide,available_for_travel,status,verification_status,featured,featured_label,sort_order,published_at,created_at,updated_at,primary_category,additional_categories,category_other,country_code,country_name,region)
  ON public.suppliers TO anon;
GRANT SELECT (id,tabulation_event_id,roster_id,final_score,final_rank,status,published_at,created_at,updated_at)
  ON public.tabulation_results TO anon;
GRANT SELECT (id,voting_event_id,roster_id,display_order,is_active,created_at)
  ON public.voting_candidates TO anon;
GRANT SELECT (id,edition_id,title,vote_mode,price_per_vote_minor,currency,max_free_votes_per_identity,starts_at,ends_at,status,review_state,show_live_totals,rules_url,published_at,finalized_at,created_at,updated_at)
  ON public.voting_events TO anon;

-- Public write surfaces: grant only the fields required by the public forms.
GRANT INSERT (occurred_at,session_id,event_name,route,referrer_host,source,entity_type,entity_id,properties)
  ON public.analytics_events TO anon;
GRANT INSERT (submission_type,supplier_id,submitted_by,contact_name,contact_email,contact_mobile,payload)
  ON public.intake_submissions TO anon;

-- Explicitly keep founder and operational internals inaccessible to anonymous clients.
REVOKE ALL PRIVILEGES ON public.founder_integrations, public.founder_escalations,
  public.founder_revenue_scorecard, public.founder_system_scorecard,
  public.billing_accounts, public.subscriptions, public.payment_transactions,
  public.commerce_orders, public.commerce_access_credentials,
  public.credit_invites, public.credit_disputes, public.crm_leads,
  public.judge_assignments, public.judge_scores,
  public.support_tickets, public.trust_cases,
  public.tabulation_events, public.tabulation_segments, public.tabulation_criteria,
  public.vote_transactions, public.notifications, public.onboarding_tasks,
  public.supplier_audit_log
FROM anon;

-- 2) Remove direct anonymous execution of internal trigger/helper functions.
REVOKE EXECUTE ON FUNCTION public.audit_supplier_change() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_supplier_updated_at() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.pageantindex_fill_edition_organization() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.pageantindex_set_updated_at() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.prepare_professional_profile_draft() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.pageantindex_is_organizer() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pageantindex_is_organizer() TO authenticated;

-- Future objects should not silently become anonymous CRUD surfaces.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;

-- 3) Versioned member privacy acknowledgement.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS privacy_policy_version text,
  ADD COLUMN IF NOT EXISTS public_profile_notice_acknowledged_at timestamptz;

CREATE TABLE IF NOT EXISTS public.member_privacy_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'signup',
  public_profile_notice_acknowledged boolean NOT NULL DEFAULT true,
  adult_or_guardian_confirmed boolean NOT NULL DEFAULT true,
  UNIQUE (user_id, policy_version)
);

ALTER TABLE public.member_privacy_acknowledgements ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON public.member_privacy_acknowledgements FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.member_privacy_acknowledgements FROM authenticated;
GRANT SELECT ON public.member_privacy_acknowledgements TO authenticated;

DROP POLICY IF EXISTS "Members read own privacy acknowledgements" ON public.member_privacy_acknowledgements;
CREATE POLICY "Members read own privacy acknowledgements"
ON public.member_privacy_acknowledgements
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
);

CREATE OR REPLACE FUNCTION private.pageantindex_record_signup_privacy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_version text := nullif(new.raw_user_meta_data ->> 'privacy_policy_version', '');
  v_ack boolean := coalesce((new.raw_user_meta_data ->> 'privacy_notice_acknowledged')::boolean, false);
  v_public_ack boolean := coalesce((new.raw_user_meta_data ->> 'public_profile_notice_acknowledged')::boolean, false);
  v_adult boolean := coalesce((new.raw_user_meta_data ->> 'adult_or_guardian_confirmed')::boolean, false);
  v_raw_role text := lower(coalesce(new.raw_user_meta_data ->> 'account_role', 'supplier'));
  v_account_type text;
  v_name text := nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 160), '');
BEGIN
  IF NOT v_ack OR v_version IS NULL THEN
    RETURN new;
  END IF;

  v_account_type := CASE v_raw_role
    WHEN 'professional' THEN 'supplier'
    WHEN 'supplier' THEN 'supplier'
    WHEN 'candidate' THEN 'candidate'
    WHEN 'organization' THEN 'organizer'
    WHEN 'organizer' THEN 'organizer'
    WHEN 'media' THEN 'media'
    WHEN 'enthusiast' THEN 'enthusiast'
    ELSE 'supplier'
  END;

  INSERT INTO public.user_profiles (
    user_id, account_type, full_name_private, display_name,
    privacy_accepted_at, privacy_policy_version,
    public_profile_notice_acknowledged_at
  ) VALUES (
    new.id, v_account_type, v_name, v_name,
    now(), v_version,
    CASE WHEN v_public_ack THEN now() ELSE NULL END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    privacy_accepted_at = COALESCE(public.user_profiles.privacy_accepted_at, EXCLUDED.privacy_accepted_at),
    privacy_policy_version = EXCLUDED.privacy_policy_version,
    public_profile_notice_acknowledged_at = COALESCE(public.user_profiles.public_profile_notice_acknowledged_at, EXCLUDED.public_profile_notice_acknowledged_at),
    updated_at = now();

  INSERT INTO public.member_privacy_acknowledgements (
    user_id, policy_version, accepted_at, source,
    public_profile_notice_acknowledged, adult_or_guardian_confirmed
  ) VALUES (
    new.id, v_version, now(), 'signup', v_public_ack, v_adult
  )
  ON CONFLICT (user_id, policy_version) DO NOTHING;

  RETURN new;
END;
$$;

REVOKE ALL ON FUNCTION private.pageantindex_record_signup_privacy() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS pageantindex_record_signup_privacy ON auth.users;
CREATE TRIGGER pageantindex_record_signup_privacy
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION private.pageantindex_record_signup_privacy();
