create index if not exists subscriptions_plan_idx on public.subscriptions(plan_id);
create index if not exists payment_transactions_billing_account_idx on public.payment_transactions(billing_account_id) where billing_account_id is not null;

create index if not exists voting_events_edition_idx on public.voting_events(edition_id);
create index if not exists voting_events_organizer_idx on public.voting_events(organizer_user_id);
create index if not exists voting_candidates_roster_idx on public.voting_candidates(roster_id);
create index if not exists vote_transactions_candidate_idx on public.vote_transactions(voting_candidate_id);
create index if not exists vote_transactions_voter_idx on public.vote_transactions(voter_user_id) where voter_user_id is not null;

create index if not exists tabulation_events_organizer_idx on public.tabulation_events(organizer_user_id);
create index if not exists judge_assignments_event_idx on public.judge_assignments(tabulation_event_id);
create index if not exists judge_scores_criterion_idx on public.judge_scores(criterion_id);
create index if not exists judge_scores_roster_idx on public.judge_scores(roster_id);
create index if not exists tabulation_results_roster_idx on public.tabulation_results(roster_id);

create index if not exists professional_credits_candidate_idx on public.professional_credits(candidate_roster_id) where candidate_roster_id is not null;
create index if not exists professional_credits_created_by_idx on public.professional_credits(created_by_user_id);
create index if not exists professional_credits_confirmed_by_idx on public.professional_credits(confirmed_by_user_id) where confirmed_by_user_id is not null;
create index if not exists credit_invites_edition_idx on public.credit_invites(edition_id);
create index if not exists credit_invites_candidate_idx on public.credit_invites(candidate_roster_id) where candidate_roster_id is not null;
create index if not exists credit_invites_accepted_by_idx on public.credit_invites(accepted_by_user_id) where accepted_by_user_id is not null;
create index if not exists credit_disputes_credit_idx on public.credit_disputes(credit_id);
create index if not exists credit_disputes_opened_by_idx on public.credit_disputes(opened_by_user_id);
create index if not exists credit_disputes_resolved_by_idx on public.credit_disputes(resolved_by_user_id) where resolved_by_user_id is not null;

create index if not exists support_tickets_assigned_to_idx on public.support_tickets(assigned_to) where assigned_to is not null;
create index if not exists trust_cases_submitted_by_idx on public.trust_cases(submitted_by_user_id) where submitted_by_user_id is not null;
create index if not exists trust_cases_resolved_by_idx on public.trust_cases(resolved_by_user_id) where resolved_by_user_id is not null;
create index if not exists notifications_user_idx on public.notifications(user_id);
create index if not exists crm_leads_owner_idx on public.crm_leads(owner_user_id) where owner_user_id is not null;

create index if not exists commerce_offers_edition_idx on public.commerce_offers(edition_id);
create index if not exists commerce_offers_organizer_idx on public.commerce_offers(organizer_user_id);
create index if not exists commerce_credentials_redeemed_by_idx on public.commerce_access_credentials(redeemed_by_user_id) where redeemed_by_user_id is not null;
