create schema if not exists private;

create or replace function private.pageantindex_touch_updated_at()
returns trigger language plpgsql
set search_path = pg_catalog, public, private
as $$ begin new.updated_at := now(); return new; end; $$;
revoke all on function private.pageantindex_touch_updated_at() from public, anon, authenticated;

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(), occurred_at timestamptz not null default now(),
  user_id uuid null references auth.users(id) on delete set null,
  session_id text null check (session_id is null or length(session_id) <= 120),
  event_name text not null check (event_name ~ '^[a-z0-9_]{2,80}$'),
  route text null check (route is null or length(route) <= 300),
  referrer_host text null check (referrer_host is null or length(referrer_host) <= 180),
  source text null check (source is null or length(source) <= 120),
  entity_type text null check (entity_type is null or entity_type ~ '^[a-z0-9_]{2,60}$'),
  entity_id uuid null, properties jsonb not null default '{}'::jsonb,
  constraint analytics_events_properties_object check (jsonb_typeof(properties) = 'object')
);
create index analytics_events_occurred_idx on public.analytics_events(occurred_at desc);
create index analytics_events_name_occurred_idx on public.analytics_events(event_name, occurred_at desc);
create index analytics_events_user_idx on public.analytics_events(user_id, occurred_at desc) where user_id is not null;
alter table public.analytics_events enable row level security;

create table public.commercial_plans (
  id uuid primary key default gen_random_uuid(), code text not null unique check (code ~ '^[a-z0-9_-]{2,60}$'),
  audience text not null check (audience in ('professional','organizer','campaign','territory')),
  name text not null, billing_interval text not null check (billing_interval in ('one_time','monthly','quarterly','annual','custom')),
  currency text not null default 'PHP' check (currency ~ '^[A-Z]{3}$'), amount_minor bigint not null check (amount_minor >= 0),
  status text not null default 'draft' check (status in ('draft','active','retired')), features jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint commercial_plans_features_array check (jsonb_typeof(features)='array')
);
alter table public.commercial_plans enable row level security;

create table public.billing_accounts (
  id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references auth.users(id) on delete cascade,
  account_type text not null check (account_type in ('professional','organizer','territory')), provider_customer_ref text null,
  billing_email text null, status text not null default 'active' check (status in ('active','past_due','suspended','closed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(owner_user_id,account_type)
);
create index billing_accounts_owner_idx on public.billing_accounts(owner_user_id);
alter table public.billing_accounts enable row level security;

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(), billing_account_id uuid not null references public.billing_accounts(id) on delete cascade,
  plan_id uuid not null references public.commercial_plans(id), provider_subscription_ref text null,
  status text not null default 'pending' check (status in ('pending','trialing','active','past_due','grace','canceled','expired')),
  current_period_start timestamptz null, current_period_end timestamptz null, cancel_at_period_end boolean not null default false,
  activated_at timestamptz null, canceled_at timestamptz null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index subscriptions_account_status_idx on public.subscriptions(billing_account_id,status);
create index subscriptions_renewal_idx on public.subscriptions(current_period_end) where status in ('active','past_due','grace');
alter table public.subscriptions enable row level security;

create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(), billing_account_id uuid null references public.billing_accounts(id) on delete set null,
  payer_user_id uuid null references auth.users(id) on delete set null, provider text null, provider_payment_ref text null unique,
  transaction_type text not null check (transaction_type in ('subscription','organizer_event','voting','ticket','ppv','merchandise','campaign','territory','refund','other')),
  amount_minor bigint not null check (amount_minor >= 0), currency text not null default 'PHP' check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'pending' check (status in ('pending','confirmed','failed','refunded','partially_refunded','void')),
  related_entity_type text null, related_entity_id uuid null, metadata jsonb not null default '{}'::jsonb, confirmed_at timestamptz null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint payment_transactions_metadata_object check (jsonb_typeof(metadata)='object')
);
create index payment_transactions_created_idx on public.payment_transactions(created_at desc);
create index payment_transactions_payer_idx on public.payment_transactions(payer_user_id,created_at desc) where payer_user_id is not null;
create index payment_transactions_entity_idx on public.payment_transactions(related_entity_type,related_entity_id) where related_entity_id is not null;
alter table public.payment_transactions enable row level security;

create table public.voting_events (
  id uuid primary key default gen_random_uuid(), edition_id uuid not null references public.pageant_edition_drafts(id) on delete cascade,
  organizer_user_id uuid not null references auth.users(id) on delete cascade, title text not null,
  vote_mode text not null default 'free' check (vote_mode in ('free','paid','mixed')), price_per_vote_minor bigint not null default 0 check (price_per_vote_minor>=0),
  currency text not null default 'PHP' check (currency ~ '^[A-Z]{3}$'), max_free_votes_per_identity integer null check (max_free_votes_per_identity is null or max_free_votes_per_identity>0),
  starts_at timestamptz not null, ends_at timestamptz not null, status text not null default 'draft' check (status in ('draft','scheduled','open','closed','finalized','canceled')),
  review_state text not null default 'pending' check (review_state in ('pending','approved','changes_requested','rejected','suspended')),
  show_live_totals boolean not null default false, rules_url text null, published_at timestamptz null, finalized_at timestamptz null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint voting_events_dates check (ends_at>starts_at), unique(edition_id,title)
);
create index voting_events_public_idx on public.voting_events(status,starts_at,ends_at) where published_at is not null and review_state='approved';
alter table public.voting_events enable row level security;

create table public.voting_candidates (
  id uuid primary key default gen_random_uuid(), voting_event_id uuid not null references public.voting_events(id) on delete cascade,
  roster_id uuid not null references public.pageant_candidate_roster_drafts(id) on delete cascade, display_order integer not null default 0,
  is_active boolean not null default true, created_at timestamptz not null default now(), unique(voting_event_id,roster_id)
);
alter table public.voting_candidates enable row level security;

create table public.vote_transactions (
  id uuid primary key default gen_random_uuid(), voting_event_id uuid not null references public.voting_events(id) on delete restrict,
  voting_candidate_id uuid not null references public.voting_candidates(id) on delete restrict, voter_user_id uuid null references auth.users(id) on delete set null,
  voter_identity_hash text null, payment_transaction_id uuid null references public.payment_transactions(id) on delete set null,
  quantity integer not null default 1 check (quantity>0 and quantity<=100000), vote_kind text not null check (vote_kind in ('free','paid','complimentary','adjustment')),
  status text not null default 'confirmed' check (status in ('pending','confirmed','void','refunded')), cast_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb, constraint vote_transactions_metadata_object check (jsonb_typeof(metadata)='object')
);
create index vote_transactions_event_candidate_idx on public.vote_transactions(voting_event_id,voting_candidate_id,status);
create index vote_transactions_identity_idx on public.vote_transactions(voting_event_id,voter_identity_hash) where voter_identity_hash is not null;
alter table public.vote_transactions enable row level security;

create table public.tabulation_events (
  id uuid primary key default gen_random_uuid(), edition_id uuid not null references public.pageant_edition_drafts(id) on delete cascade,
  organizer_user_id uuid not null references auth.users(id) on delete cascade, title text not null,
  status text not null default 'draft' check (status in ('draft','rehearsal','locked','live','finalized','canceled')),
  scoring_precision integer not null default 2 check (scoring_precision between 0 and 4), locked_at timestamptz null, live_at timestamptz null,
  finalized_at timestamptz null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(edition_id,title)
);
alter table public.tabulation_events enable row level security;

create table public.tabulation_segments (
  id uuid primary key default gen_random_uuid(), tabulation_event_id uuid not null references public.tabulation_events(id) on delete cascade,
  name text not null, display_order integer not null default 0, weight numeric(8,4) not null default 1 check (weight>0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tabulation_event_id,name)
);
alter table public.tabulation_segments enable row level security;

create table public.tabulation_criteria (
  id uuid primary key default gen_random_uuid(), segment_id uuid not null references public.tabulation_segments(id) on delete cascade,
  name text not null, max_score numeric(10,4) not null default 100 check (max_score>0), weight numeric(8,4) not null default 1 check (weight>0),
  display_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(segment_id,name)
);
alter table public.tabulation_criteria enable row level security;

create table public.judge_assignments (
  id uuid primary key default gen_random_uuid(), tabulation_event_id uuid not null references public.tabulation_events(id) on delete cascade,
  judge_user_id uuid null references auth.users(id) on delete set null, judge_email text null, judge_display_name text not null,
  status text not null default 'invited' check (status in ('invited','accepted','active','revoked','completed')), access_token_hash text null unique,
  accepted_at timestamptz null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint judge_assignment_identity check (judge_user_id is not null or judge_email is not null)
);
create index judge_assignments_user_idx on public.judge_assignments(judge_user_id) where judge_user_id is not null;
alter table public.judge_assignments enable row level security;

create table public.judge_scores (
  id uuid primary key default gen_random_uuid(), tabulation_event_id uuid not null references public.tabulation_events(id) on delete cascade,
  judge_assignment_id uuid not null references public.judge_assignments(id) on delete cascade, criterion_id uuid not null references public.tabulation_criteria(id) on delete cascade,
  roster_id uuid not null references public.pageant_candidate_roster_drafts(id) on delete cascade, score numeric(10,4) not null check (score>=0),
  note text null check (note is null or length(note)<=1000), submitted_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(judge_assignment_id,criterion_id,roster_id)
);
create index judge_scores_event_roster_idx on public.judge_scores(tabulation_event_id,roster_id);
alter table public.judge_scores enable row level security;

create table public.tabulation_results (
  id uuid primary key default gen_random_uuid(), tabulation_event_id uuid not null references public.tabulation_events(id) on delete cascade,
  roster_id uuid not null references public.pageant_candidate_roster_drafts(id) on delete cascade, final_score numeric(14,6) not null,
  final_rank integer null check (final_rank is null or final_rank>0), status text not null default 'provisional' check (status in ('provisional','final','void')),
  published_at timestamptz null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tabulation_event_id,roster_id)
);
alter table public.tabulation_results enable row level security;

create table public.professional_credits (
  id uuid primary key default gen_random_uuid(), edition_id uuid not null references public.pageant_edition_drafts(id) on delete cascade,
  candidate_roster_id uuid null references public.pageant_candidate_roster_drafts(id) on delete cascade, supplier_user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (length(role) between 2 and 160), credit_scope text not null check (credit_scope in ('organization','candidate')),
  status text not null default 'proposed' check (status in ('proposed','confirmed','disputed','removed')),
  created_by_user_id uuid not null references auth.users(id) on delete restrict, confirmed_by_user_id uuid null references auth.users(id) on delete set null,
  confirmed_at timestamptz null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint professional_credit_candidate_scope check ((credit_scope='organization' and candidate_roster_id is null) or (credit_scope='candidate' and candidate_roster_id is not null)),
  unique(edition_id,candidate_roster_id,supplier_user_id,role)
);
create index professional_credits_supplier_idx on public.professional_credits(supplier_user_id,status);
create index professional_credits_edition_idx on public.professional_credits(edition_id,status);
alter table public.professional_credits enable row level security;

create table public.credit_invites (
  id uuid primary key default gen_random_uuid(), edition_id uuid not null references public.pageant_edition_drafts(id) on delete cascade,
  candidate_roster_id uuid null references public.pageant_candidate_roster_drafts(id) on delete cascade, organizer_user_id uuid not null references auth.users(id) on delete cascade,
  invited_email text null, proposed_role text not null, credit_scope text not null check (credit_scope in ('organization','candidate')),
  token_hash text not null unique, status text not null default 'pending' check (status in ('pending','accepted','declined','expired','revoked')),
  accepted_by_user_id uuid null references auth.users(id) on delete set null, expires_at timestamptz not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint credit_invite_candidate_scope check ((credit_scope='organization' and candidate_roster_id is null) or (credit_scope='candidate' and candidate_roster_id is not null))
);
create index credit_invites_organizer_status_idx on public.credit_invites(organizer_user_id,status);
alter table public.credit_invites enable row level security;

create table public.credit_disputes (
  id uuid primary key default gen_random_uuid(), credit_id uuid not null references public.professional_credits(id) on delete cascade,
  opened_by_user_id uuid not null references auth.users(id) on delete cascade, reason text not null check (length(reason) between 5 and 2000),
  status text not null default 'open' check (status in ('open','reviewing','resolved','rejected')), resolution_note text null,
  resolved_by_user_id uuid null references auth.users(id) on delete set null, resolved_at timestamptz null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.credit_disputes enable row level security;

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(), case_reference text not null unique default ('PI-SUP-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('account','profile','verification','billing','voting','tabulation','event','technical','safety','other')),
  title text not null check (length(title) between 3 and 200), description text not null check (length(description) between 5 and 5000),
  severity text not null default 'normal' check (severity in ('normal','high','critical')),
  status text not null default 'open' check (status in ('open','in_progress','waiting_user','resolved','closed')),
  assigned_to uuid null references auth.users(id) on delete set null, resolved_at timestamptz null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index support_tickets_owner_status_idx on public.support_tickets(owner_user_id,status);
create index support_tickets_queue_idx on public.support_tickets(severity,status,created_at desc);
alter table public.support_tickets enable row level security;

create table public.trust_cases (
  id uuid primary key default gen_random_uuid(), case_reference text not null unique default ('PI-TRUST-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  submitted_by_user_id uuid null references auth.users(id) on delete set null,
  report_type text not null check (report_type in ('impersonation','copyright','harassment','fraud','safety','privacy','minor_safety','other')),
  subject_type text null, subject_id uuid null, contact_email text null, summary text not null check (length(summary) between 10 and 6000),
  evidence_urls jsonb not null default '[]'::jsonb, severity text not null default 'normal' check (severity in ('normal','high','critical')),
  status text not null default 'open' check (status in ('open','triage','investigating','actioned','resolved','rejected')),
  resolution_note text null, resolved_by_user_id uuid null references auth.users(id) on delete set null, resolved_at timestamptz null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint trust_cases_evidence_array check (jsonb_typeof(evidence_urls)='array')
);
create index trust_cases_queue_idx on public.trust_cases(severity,status,created_at desc);
alter table public.trust_cases enable row level security;

create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null, title text not null, body text null, target_url text null, read_at timestamptz null, created_at timestamptz not null default now()
);
create index notifications_user_unread_idx on public.notifications(user_id,created_at desc) where read_at is null;
alter table public.notifications enable row level security;

create table public.onboarding_tasks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  task_code text not null, title text not null, task_group text not null default 'profile',
  status text not null default 'pending' check (status in ('pending','completed','skipped')), due_at timestamptz null, completed_at timestamptz null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,task_code)
);
alter table public.onboarding_tasks enable row level security;

create table public.crm_leads (
  id uuid primary key default gen_random_uuid(), lead_type text not null check (lead_type in ('professional','organizer','partner','enterprise','territory','investor')),
  name text not null, organization text null, email text null, source text null,
  stage text not null default 'new' check (stage in ('new','contacted','qualified','meeting','proposal','negotiation','won','lost','nurture')),
  value_minor bigint null check (value_minor is null or value_minor>=0), currency text null check (currency is null or currency ~ '^[A-Z]{3}$'),
  owner_user_id uuid null references auth.users(id) on delete set null, next_action_at timestamptz null, notes text null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index crm_leads_stage_action_idx on public.crm_leads(stage,next_action_at);
alter table public.crm_leads enable row level security;

create table public.territory_licenses (
  id uuid primary key default gen_random_uuid(), territory_code text not null, territory_name text not null, licensee_name text not null,
  status text not null default 'prospect' check (status in ('prospect','negotiation','active','suspended','expired','terminated')),
  starts_at timestamptz null, ends_at timestamptz null, setup_fee_minor bigint null check (setup_fee_minor is null or setup_fee_minor>=0),
  recurring_fee_minor bigint null check (recurring_fee_minor is null or recurring_fee_minor>=0), royalty_bps integer null check (royalty_bps is null or royalty_bps between 0 and 10000),
  currency text not null default 'PHP' check (currency ~ '^[A-Z]{3}$'), minimum_performance jsonb not null default '{}'::jsonb,
  brand_rules_url text null, reporting_terms text null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint territory_licenses_performance_object check (jsonb_typeof(minimum_performance)='object')
);
create index territory_licenses_status_idx on public.territory_licenses(status,ends_at);
alter table public.territory_licenses enable row level security;

create or replace function private.pageantindex_guard_voting_candidate()
returns trigger language plpgsql set search_path=pg_catalog,public,private
as $$ declare event_edition uuid; roster_edition uuid; begin
  select edition_id into event_edition from public.voting_events where id=new.voting_event_id;
  select edition_id into roster_edition from public.pageant_candidate_roster_drafts where id=new.roster_id;
  if event_edition is null or roster_edition is null or event_edition<>roster_edition then raise exception 'Voting candidate must belong to the voting event edition.'; end if;
  return new;
end; $$;
revoke all on function private.pageantindex_guard_voting_candidate() from public,anon,authenticated;
create trigger voting_candidates_guard before insert or update on public.voting_candidates for each row execute function private.pageantindex_guard_voting_candidate();

create or replace function private.pageantindex_guard_vote_transaction()
returns trigger language plpgsql set search_path=pg_catalog,public,private
as $$ declare candidate_event uuid; payment_ok boolean; begin
  select voting_event_id into candidate_event from public.voting_candidates where id=new.voting_candidate_id;
  if candidate_event is distinct from new.voting_event_id then raise exception 'Vote candidate does not belong to this voting event.'; end if;
  if new.vote_kind='paid' then
    if new.payment_transaction_id is null then raise exception 'Paid votes require a payment transaction.'; end if;
    select exists(select 1 from public.payment_transactions p where p.id=new.payment_transaction_id and p.status='confirmed' and p.transaction_type='voting') into payment_ok;
    if not payment_ok then raise exception 'Paid votes require a confirmed voting payment.'; end if;
  end if;
  return new;
end; $$;
revoke all on function private.pageantindex_guard_vote_transaction() from public,anon,authenticated;
create trigger vote_transactions_guard before insert or update on public.vote_transactions for each row execute function private.pageantindex_guard_vote_transaction();

create or replace function private.pageantindex_guard_judge_score()
returns trigger language plpgsql set search_path=pg_catalog,public,private
as $$ declare assignment_event uuid; criterion_event uuid; event_edition uuid; roster_edition uuid; criterion_max numeric; begin
  select tabulation_event_id into assignment_event from public.judge_assignments where id=new.judge_assignment_id;
  select s.tabulation_event_id,c.max_score into criterion_event,criterion_max from public.tabulation_criteria c join public.tabulation_segments s on s.id=c.segment_id where c.id=new.criterion_id;
  select edition_id into event_edition from public.tabulation_events where id=new.tabulation_event_id;
  select edition_id into roster_edition from public.pageant_candidate_roster_drafts where id=new.roster_id;
  if assignment_event is distinct from new.tabulation_event_id or criterion_event is distinct from new.tabulation_event_id then raise exception 'Judge assignment and criterion must belong to the same tabulation event.'; end if;
  if event_edition is null or roster_edition is null or event_edition<>roster_edition then raise exception 'Scored candidate must belong to the tabulation event edition.'; end if;
  if new.score>criterion_max then raise exception 'Score exceeds criterion maximum.'; end if;
  return new;
end; $$;
revoke all on function private.pageantindex_guard_judge_score() from public,anon,authenticated;
create trigger judge_scores_guard before insert or update on public.judge_scores for each row execute function private.pageantindex_guard_judge_score();

create or replace function private.pageantindex_guard_credit_link()
returns trigger language plpgsql set search_path=pg_catalog,public,private
as $$ declare roster_edition uuid; supplier_exists boolean; begin
  if new.candidate_roster_id is not null then
    select edition_id into roster_edition from public.pageant_candidate_roster_drafts where id=new.candidate_roster_id;
    if roster_edition is distinct from new.edition_id then raise exception 'Candidate credit must reference a candidate in the same edition.'; end if;
  end if;
  select exists(select 1 from public.professional_profile_drafts p where p.user_id=new.supplier_user_id) into supplier_exists;
  if not supplier_exists then raise exception 'Supplier must have a PageantIndex professional profile before a credit is attached.'; end if;
  return new;
end; $$;
revoke all on function private.pageantindex_guard_credit_link() from public,anon,authenticated;
create trigger professional_credits_guard before insert or update on public.professional_credits for each row execute function private.pageantindex_guard_credit_link();

create or replace function private.pageantindex_guard_credit_invite()
returns trigger language plpgsql set search_path=pg_catalog,public,private
as $$ declare roster_edition uuid; begin
  if new.candidate_roster_id is not null then
    select edition_id into roster_edition from public.pageant_candidate_roster_drafts where id=new.candidate_roster_id;
    if roster_edition is distinct from new.edition_id then raise exception 'Candidate invite must reference a candidate in the same edition.'; end if;
  end if;
  return new;
end; $$;
revoke all on function private.pageantindex_guard_credit_invite() from public,anon,authenticated;
create trigger credit_invites_guard before insert or update on public.credit_invites for each row execute function private.pageantindex_guard_credit_invite();

do $$ declare t text; begin
  foreach t in array array['commercial_plans','billing_accounts','subscriptions','payment_transactions','voting_events','tabulation_events','tabulation_segments','tabulation_criteria','judge_assignments','judge_scores','tabulation_results','professional_credits','credit_invites','credit_disputes','support_tickets','trust_cases','onboarding_tasks','crm_leads','territory_licenses'] loop
    execute format('create trigger %I_touch_updated_at before update on public.%I for each row execute function private.pageantindex_touch_updated_at()',t,t);
  end loop;
end; $$;

create policy "Public records sanitized analytics" on public.analytics_events for insert to anon with check (user_id is null);
create policy "Authenticated users record own analytics" on public.analytics_events for insert to authenticated with check (user_id is null or user_id=(select auth.uid()));
create policy "Admins read analytics" on public.analytics_events for select to authenticated using ((((select auth.jwt())->'app_metadata'->>'role'))='admin');
create policy "Admins manage commercial plans" on public.commercial_plans for all to authenticated using ((((select auth.jwt())->'app_metadata'->>'role'))='admin') with check ((((select auth.jwt())->'app_metadata'->>'role'))='admin');
create policy "Owners read billing accounts" on public.billing_accounts for select to authenticated using (owner_user_id=(select auth.uid()) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy "Admins manage billing accounts" on public.billing_accounts for all to authenticated using ((((select auth.jwt())->'app_metadata'->>'role'))='admin') with check ((((select auth.jwt())->'app_metadata'->>'role'))='admin');
create policy "Owners read subscriptions" on public.subscriptions for select to authenticated using (exists(select 1 from public.billing_accounts b where b.id=subscriptions.billing_account_id and b.owner_user_id=(select auth.uid())) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy "Admins manage subscriptions" on public.subscriptions for all to authenticated using ((((select auth.jwt())->'app_metadata'->>'role'))='admin') with check ((((select auth.jwt())->'app_metadata'->>'role'))='admin');
create policy "Payers read their transactions" on public.payment_transactions for select to authenticated using (payer_user_id=(select auth.uid()) or exists(select 1 from public.billing_accounts b where b.id=payment_transactions.billing_account_id and b.owner_user_id=(select auth.uid())) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy "Admins manage payment transactions" on public.payment_transactions for all to authenticated using ((((select auth.jwt())->'app_metadata'->>'role'))='admin') with check ((((select auth.jwt())->'app_metadata'->>'role'))='admin');

create policy "Public reads approved voting events" on public.voting_events for select to anon using (review_state='approved' and published_at is not null and status in ('scheduled','open','closed','finalized'));
create policy "Users read voting events" on public.voting_events for select to authenticated using ((review_state='approved' and published_at is not null and status in ('scheduled','open','closed','finalized')) or organizer_user_id=(select auth.uid()) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy "Organizers create own voting events" on public.voting_events for insert to authenticated with check (organizer_user_id=(select auth.uid()) and review_state='pending' and published_at is null and exists(select 1 from public.pageant_edition_drafts e where e.id=voting_events.edition_id and e.organizer_user_id=(select auth.uid())));
create policy "Organizers update own voting events" on public.voting_events for update to authenticated using (organizer_user_id=(select auth.uid())) with check (organizer_user_id=(select auth.uid()) and exists(select 1 from public.pageant_edition_drafts e where e.id=voting_events.edition_id and e.organizer_user_id=(select auth.uid())));
create policy "Admins manage voting events" on public.voting_events for all to authenticated using ((((select auth.jwt())->'app_metadata'->>'role'))='admin') with check ((((select auth.jwt())->'app_metadata'->>'role'))='admin');
create policy "Public reads active voting candidates" on public.voting_candidates for select to anon using (is_active and exists(select 1 from public.voting_events v where v.id=voting_candidates.voting_event_id and v.review_state='approved' and v.published_at is not null and v.status in ('scheduled','open','closed','finalized')));
create policy "Users read voting candidates" on public.voting_candidates for select to authenticated using (exists(select 1 from public.voting_events v where v.id=voting_candidates.voting_event_id and ((v.review_state='approved' and v.published_at is not null) or v.organizer_user_id=(select auth.uid()))) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy "Organizers manage voting candidates" on public.voting_candidates for all to authenticated using (exists(select 1 from public.voting_events v where v.id=voting_candidates.voting_event_id and v.organizer_user_id=(select auth.uid()) and v.status in ('draft','scheduled'))) with check (exists(select 1 from public.voting_events v where v.id=voting_candidates.voting_event_id and v.organizer_user_id=(select auth.uid()) and v.status in ('draft','scheduled')));
create policy "Organizers and admins read vote ledger" on public.vote_transactions for select to authenticated using (exists(select 1 from public.voting_events v where v.id=vote_transactions.voting_event_id and v.organizer_user_id=(select auth.uid())) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));

create policy "Organizers and admins manage tabulation events" on public.tabulation_events for all to authenticated using (organizer_user_id=(select auth.uid()) or (((select auth.jwt())->'app_metadata'->>'role')='admin')) with check ((organizer_user_id=(select auth.uid()) and exists(select 1 from public.pageant_edition_drafts e where e.id=tabulation_events.edition_id and e.organizer_user_id=(select auth.uid()))) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy "Authorized users read tabulation segments" on public.tabulation_segments for select to authenticated using (exists(select 1 from public.tabulation_events e where e.id=tabulation_segments.tabulation_event_id and (e.organizer_user_id=(select auth.uid()) or (((select auth.jwt())->'app_metadata'->>'role')='admin') or exists(select 1 from public.judge_assignments j where j.tabulation_event_id=e.id and j.judge_user_id=(select auth.uid()) and j.status in ('accepted','active','completed')))));
create policy "Organizers manage tabulation segments" on public.tabulation_segments for all to authenticated using (exists(select 1 from public.tabulation_events e where e.id=tabulation_segments.tabulation_event_id and e.organizer_user_id=(select auth.uid()) and e.status in ('draft','rehearsal'))) with check (exists(select 1 from public.tabulation_events e where e.id=tabulation_segments.tabulation_event_id and e.organizer_user_id=(select auth.uid()) and e.status in ('draft','rehearsal')));
create policy "Authorized users read tabulation criteria" on public.tabulation_criteria for select to authenticated using (exists(select 1 from public.tabulation_segments s join public.tabulation_events e on e.id=s.tabulation_event_id where s.id=tabulation_criteria.segment_id and (e.organizer_user_id=(select auth.uid()) or (((select auth.jwt())->'app_metadata'->>'role')='admin') or exists(select 1 from public.judge_assignments j where j.tabulation_event_id=e.id and j.judge_user_id=(select auth.uid()) and j.status in ('accepted','active','completed')))));
create policy "Organizers manage tabulation criteria" on public.tabulation_criteria for all to authenticated using (exists(select 1 from public.tabulation_segments s join public.tabulation_events e on e.id=s.tabulation_event_id where s.id=tabulation_criteria.segment_id and e.organizer_user_id=(select auth.uid()) and e.status in ('draft','rehearsal'))) with check (exists(select 1 from public.tabulation_segments s join public.tabulation_events e on e.id=s.tabulation_event_id where s.id=tabulation_criteria.segment_id and e.organizer_user_id=(select auth.uid()) and e.status in ('draft','rehearsal')));
create policy "Organizers judges and admins read assignments" on public.judge_assignments for select to authenticated using (judge_user_id=(select auth.uid()) or exists(select 1 from public.tabulation_events e where e.id=judge_assignments.tabulation_event_id and e.organizer_user_id=(select auth.uid())) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy "Organizers manage judge assignments" on public.judge_assignments for all to authenticated using (exists(select 1 from public.tabulation_events e where e.id=judge_assignments.tabulation_event_id and e.organizer_user_id=(select auth.uid()) and e.status in ('draft','rehearsal','locked'))) with check (exists(select 1 from public.tabulation_events e where e.id=judge_assignments.tabulation_event_id and e.organizer_user_id=(select auth.uid()) and e.status in ('draft','rehearsal','locked')));
create policy "Judges organizers and admins read scores" on public.judge_scores for select to authenticated using (exists(select 1 from public.judge_assignments j where j.id=judge_scores.judge_assignment_id and j.judge_user_id=(select auth.uid())) or exists(select 1 from public.tabulation_events e where e.id=judge_scores.tabulation_event_id and e.organizer_user_id=(select auth.uid())) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy "Judges create own live scores" on public.judge_scores for insert to authenticated with check (exists(select 1 from public.judge_assignments j join public.tabulation_events e on e.id=j.tabulation_event_id where j.id=judge_scores.judge_assignment_id and j.judge_user_id=(select auth.uid()) and j.status in ('accepted','active') and e.status in ('rehearsal','live')) and exists(select 1 from public.tabulation_criteria c where c.id=judge_scores.criterion_id and judge_scores.score<=c.max_score));
create policy "Judges update own live scores" on public.judge_scores for update to authenticated using (exists(select 1 from public.judge_assignments j join public.tabulation_events e on e.id=j.tabulation_event_id where j.id=judge_scores.judge_assignment_id and j.judge_user_id=(select auth.uid()) and e.status in ('rehearsal','live'))) with check (exists(select 1 from public.judge_assignments j join public.tabulation_events e on e.id=j.tabulation_event_id where j.id=judge_scores.judge_assignment_id and j.judge_user_id=(select auth.uid()) and j.status in ('accepted','active') and e.status in ('rehearsal','live')) and exists(select 1 from public.tabulation_criteria c where c.id=judge_scores.criterion_id and judge_scores.score<=c.max_score));
create policy "Organizers and admins read tabulation results" on public.tabulation_results for select to authenticated using (exists(select 1 from public.tabulation_events e where e.id=tabulation_results.tabulation_event_id and e.organizer_user_id=(select auth.uid())) or (((select auth.jwt())->'app_metadata'->>'role')='admin') or (status='final' and published_at is not null));
create policy "Public reads published tabulation results" on public.tabulation_results for select to anon using (status='final' and published_at is not null);
create policy "Organizers and admins manage tabulation results" on public.tabulation_results for all to authenticated using (exists(select 1 from public.tabulation_events e where e.id=tabulation_results.tabulation_event_id and e.organizer_user_id=(select auth.uid())) or (((select auth.jwt())->'app_metadata'->>'role')='admin')) with check (exists(select 1 from public.tabulation_events e where e.id=tabulation_results.tabulation_event_id and e.organizer_user_id=(select auth.uid())) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));

create policy "Public reads confirmed professional credits" on public.professional_credits for select to anon using (status='confirmed');
create policy "Participants read professional credits" on public.professional_credits for select to authenticated using (status='confirmed' or supplier_user_id=(select auth.uid()) or created_by_user_id=(select auth.uid()) or exists(select 1 from public.pageant_edition_drafts e where e.id=professional_credits.edition_id and e.organizer_user_id=(select auth.uid())) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy "Participants propose professional credits" on public.professional_credits for insert to authenticated with check (created_by_user_id=(select auth.uid()) and status='proposed' and (supplier_user_id=(select auth.uid()) or exists(select 1 from public.pageant_edition_drafts e where e.id=professional_credits.edition_id and e.organizer_user_id=(select auth.uid()))));
create policy "Participants update professional credit status" on public.professional_credits for update to authenticated using (supplier_user_id=(select auth.uid()) or exists(select 1 from public.pageant_edition_drafts e where e.id=professional_credits.edition_id and e.organizer_user_id=(select auth.uid())) or (((select auth.jwt())->'app_metadata'->>'role')='admin')) with check (supplier_user_id=(select auth.uid()) or exists(select 1 from public.pageant_edition_drafts e where e.id=professional_credits.edition_id and e.organizer_user_id=(select auth.uid())) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy "Organizers read credit invites" on public.credit_invites for select to authenticated using (organizer_user_id=(select auth.uid()) or accepted_by_user_id=(select auth.uid()) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy "Credit participants create disputes" on public.credit_disputes for insert to authenticated with check (opened_by_user_id=(select auth.uid()) and exists(select 1 from public.professional_credits c where c.id=credit_disputes.credit_id and (c.supplier_user_id=(select auth.uid()) or c.created_by_user_id=(select auth.uid()) or exists(select 1 from public.pageant_edition_drafts e where e.id=c.edition_id and e.organizer_user_id=(select auth.uid())))));
create policy "Credit participants read disputes" on public.credit_disputes for select to authenticated using (opened_by_user_id=(select auth.uid()) or exists(select 1 from public.professional_credits c where c.id=credit_disputes.credit_id and (c.supplier_user_id=(select auth.uid()) or exists(select 1 from public.pageant_edition_drafts e where e.id=c.edition_id and e.organizer_user_id=(select auth.uid())))) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy "Admins resolve credit disputes" on public.credit_disputes for update to authenticated using ((((select auth.jwt())->'app_metadata'->>'role'))='admin') with check ((((select auth.jwt())->'app_metadata'->>'role'))='admin');

create policy "Users create support tickets" on public.support_tickets for insert to authenticated with check (owner_user_id=(select auth.uid()) and severity='normal' and status='open' and assigned_to is null);
create policy "Users and admins read support tickets" on public.support_tickets for select to authenticated using (owner_user_id=(select auth.uid()) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy "Admins manage support tickets" on public.support_tickets for all to authenticated using ((((select auth.jwt())->'app_metadata'->>'role'))='admin') with check ((((select auth.jwt())->'app_metadata'->>'role'))='admin');
create policy "Authenticated users submit trust cases" on public.trust_cases for insert to authenticated with check (submitted_by_user_id=(select auth.uid()) and severity='normal' and status='open' and resolved_by_user_id is null and resolved_at is null);
create policy "Submitters and admins read trust cases" on public.trust_cases for select to authenticated using (submitted_by_user_id=(select auth.uid()) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy "Admins manage trust cases" on public.trust_cases for all to authenticated using ((((select auth.jwt())->'app_metadata'->>'role'))='admin') with check ((((select auth.jwt())->'app_metadata'->>'role'))='admin');
create policy "Users read notifications" on public.notifications for select to authenticated using (user_id=(select auth.uid()) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy "Users mark notifications read" on public.notifications for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "Admins create notifications" on public.notifications for insert to authenticated with check ((((select auth.jwt())->'app_metadata'->>'role'))='admin');
create policy "Users manage own onboarding tasks" on public.onboarding_tasks for all to authenticated using (user_id=(select auth.uid()) or (((select auth.jwt())->'app_metadata'->>'role')='admin')) with check (user_id=(select auth.uid()) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy "Admins manage CRM leads" on public.crm_leads for all to authenticated using ((((select auth.jwt())->'app_metadata'->>'role'))='admin') with check ((((select auth.jwt())->'app_metadata'->>'role'))='admin');
create policy "Admins manage territory licenses" on public.territory_licenses for all to authenticated using ((((select auth.jwt())->'app_metadata'->>'role'))='admin') with check ((((select auth.jwt())->'app_metadata'->>'role'))='admin');

grant insert on public.analytics_events to anon,authenticated;
grant select on public.analytics_events to authenticated;
grant select,insert,update,delete on public.commercial_plans,public.billing_accounts,public.subscriptions,public.payment_transactions to authenticated;
grant select on public.voting_events,public.voting_candidates,public.tabulation_results,public.professional_credits to anon;
grant select,insert on public.voting_events to authenticated;
grant update (title,vote_mode,price_per_vote_minor,currency,max_free_votes_per_identity,starts_at,ends_at,status,show_live_totals,rules_url) on public.voting_events to authenticated;
grant select,insert,update,delete on public.voting_candidates to authenticated;
grant select on public.vote_transactions to authenticated;
grant select,insert,update,delete on public.tabulation_events,public.tabulation_segments,public.tabulation_criteria,public.judge_assignments,public.tabulation_results to authenticated;
grant select,insert,update on public.judge_scores to authenticated;
grant select,insert on public.professional_credits to authenticated;
grant update (status,confirmed_by_user_id,confirmed_at,role) on public.professional_credits to authenticated;
grant select on public.credit_invites to authenticated;
grant select,insert,update on public.credit_disputes,public.support_tickets,public.trust_cases to authenticated;
grant select,update,insert on public.notifications to authenticated;
grant select,insert,update,delete on public.onboarding_tasks,public.crm_leads,public.territory_licenses to authenticated;

create view public.tabulation_score_totals with (security_invoker=true) as
select e.id as tabulation_event_id,js.roster_id,
  round(sum((js.score/c.max_score)*c.weight*s.weight)::numeric,e.scoring_precision) as weighted_score,
  count(*)::int as score_count,
  dense_rank() over(partition by e.id order by sum((js.score/c.max_score)*c.weight*s.weight) desc)::int as current_rank
from public.judge_scores js
join public.tabulation_criteria c on c.id=js.criterion_id
join public.tabulation_segments s on s.id=c.segment_id
join public.tabulation_events e on e.id=js.tabulation_event_id and e.id=s.tabulation_event_id
group by e.id,js.roster_id,e.scoring_precision;
grant select on public.tabulation_score_totals to authenticated;

create view public.founder_revenue_scorecard with (security_invoker=true) as
select currency,count(*) filter(where status='confirmed')::int as confirmed_transactions_30d,
  coalesce(sum(amount_minor) filter(where status='confirmed'),0)::bigint as revenue_30d_minor
from public.payment_transactions where created_at>=now()-interval '30 days' group by currency;
grant select on public.founder_revenue_scorecard to authenticated;

create view public.founder_system_scorecard with (security_invoker=true) as
select
  (select count(*) from public.subscriptions where status='active')::int as active_subscriptions,
  (select count(*) from public.subscriptions where status in ('past_due','grace') or (status='active' and current_period_end is not null and current_period_end<now()+interval '14 days'))::int as renewals_at_risk,
  (select count(*) from public.support_tickets where status in ('open','in_progress','waiting_user') and severity in ('high','critical'))::int as high_support_cases,
  (select count(*) from public.founder_escalations where status in ('open','acknowledged'))::int as founder_escalations,
  (select count(*) from public.voting_events where status='open')::int as open_voting_events,
  (select count(*) from public.tabulation_events where status='live')::int as live_tabulation_events;
grant select on public.founder_system_scorecard to authenticated;
