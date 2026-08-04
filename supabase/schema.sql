-- Pageant Index Philippines
-- Future platform reference schema. This file is not the canonical live migration.
-- Production changes must be made through supabase/migrations and tested before rollout.

create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.app_role as enum ('user','professional_owner','editor','verifier','moderator','admin','super_admin');
create type public.profile_status as enum ('unclaimed','claim_pending','basic','verified','professional','featured','founding_member','suspended','archived');
create type public.claim_status as enum ('draft','submitted','under_review','revision_requested','approved','rejected','withdrawn');
create type public.verification_status as enum ('not_requested','draft','submitted','under_review','revision_requested','verified','expired','rejected','revoked');
create type public.subscription_status as enum ('trialing','active','past_due','cancelled','expired');
create type public.placement_type as enum ('homepage','category','location','search','article','event');
create type public.inquiry_status as enum ('new','opened','replied','qualified','booked','closed','spam');
create type public.review_status as enum ('pending','published','hidden_investigation','rejected','removed');
create type public.report_status as enum ('submitted','triaged','under_review','awaiting_response','resolved','dismissed');
create type public.event_status as enum ('draft','pending','published','cancelled','completed','archived');
create type public.content_status as enum ('draft','review','scheduled','published','archived');
create type public.notification_type as enum ('inquiry','claim','verification','review','subscription','renewal','report','system');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext unique,
  full_name text,
  mobile text,
  avatar_url text,
  role public.app_role not null default 'user',
  is_active boolean not null default true,
  consent_terms_at timestamptz,
  consent_privacy_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  icon_key text,
  verification_requirements jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.locations(id) on delete restrict,
  location_type text not null check (location_type in ('country','region','province','city','municipality')),
  name text not null,
  slug text not null,
  region_code text,
  province_code text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(parent_id, slug)
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  legal_name text,
  public_name text not null,
  registration_number text,
  registration_type text,
  owner_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  owner_user_id uuid references public.users(id) on delete set null,
  primary_category_id uuid not null references public.categories(id) on delete restrict,
  primary_location_id uuid references public.locations(id) on delete restrict,
  slug text not null unique,
  public_name text not null,
  headline text,
  biography text,
  logo_url text,
  cover_url text,
  email citext,
  mobile text,
  website_url text,
  social_links jsonb not null default '{}'::jsonb,
  business_hours jsonb not null default '{}'::jsonb,
  years_experience integer check (years_experience >= 0 and years_experience <= 100),
  languages text[] not null default '{}',
  starting_rate numeric(12,2) check (starting_rate >= 0),
  price_range_min numeric(12,2) check (price_range_min >= 0),
  price_range_max numeric(12,2) check (price_range_max >= 0),
  accepts_nationwide boolean not null default false,
  available_for_travel boolean not null default false,
  status public.profile_status not null default 'unclaimed',
  verification_status public.verification_status not null default 'not_requested',
  profile_completeness smallint not null default 0 check (profile_completeness between 0 and 100),
  average_rating numeric(3,2) check (average_rating between 0 and 5),
  verified_review_count integer not null default 0,
  view_count bigint not null default 0,
  inquiry_count bigint not null default 0,
  response_rate numeric(5,2) check (response_rate between 0 and 100),
  last_active_at timestamptz,
  last_public_update_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_document tsvector generated always as (
    to_tsvector('simple', coalesce(public_name,'') || ' ' || coalesce(headline,'') || ' ' || coalesce(biography,''))
  ) stored
);

create table public.profile_categories (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  is_primary boolean not null default false,
  primary key(profile_id, category_id)
);

create table public.service_areas (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete restrict,
  travel_fee_note text,
  primary key(profile_id, location_id)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete restrict,
  name text not null,
  description text,
  starting_rate numeric(12,2) check (starting_rate >= 0),
  rate_unit text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  price numeric(12,2) check (price >= 0),
  inclusions jsonb not null default '[]'::jsonb,
  terms text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('image','video','external_video')),
  title text,
  description text,
  media_url text not null,
  thumbnail_url text,
  alt_text text,
  project_date date,
  client_name text,
  category_id uuid references public.categories(id) on delete set null,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  claimant_user_id uuid not null references public.users(id) on delete cascade,
  relationship_to_business text not null,
  submitted_contact jsonb not null default '{}'::jsonb,
  evidence_summary text,
  status public.claim_status not null default 'draft',
  reviewer_user_id uuid references public.users(id) on delete set null,
  reviewer_notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  requested_by uuid not null references public.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  status public.verification_status not null default 'draft',
  evidence_summary text,
  reviewer_user_id uuid references public.users(id) on delete set null,
  reviewer_notes text,
  submitted_at timestamptz,
  verified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.verification_documents (
  id uuid primary key default gen_random_uuid(),
  verification_request_id uuid references public.verification_requests(id) on delete cascade,
  claim_id uuid references public.claims(id) on delete cascade,
  document_type text not null,
  storage_path text not null,
  original_filename text,
  mime_type text,
  file_size_bytes bigint check (file_size_bytes >= 0),
  checksum_sha256 text,
  uploaded_by uuid not null references public.users(id) on delete restrict,
  reviewed_by uuid references public.users(id) on delete set null,
  review_status text not null default 'pending' check (review_status in ('pending','accepted','rejected','expired')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  constraint one_parent check ((verification_request_id is not null)::int + (claim_id is not null)::int = 1)
);

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  amount numeric(12,2) not null check (amount >= 0),
  billing_interval text not null check (billing_interval in ('month','year','one_time')),
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  status public.subscription_status not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.subscriptions(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  provider text,
  provider_payment_id text unique,
  amount numeric(12,2) not null check (amount >= 0),
  currency char(3) not null default 'PHP',
  status text not null,
  invoice_url text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.featured_placements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  event_id uuid,
  placement_type public.placement_type not null,
  category_id uuid references public.categories(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  label text not null default 'Featured',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  campaign_name text,
  budget numeric(12,2) check (budget >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint valid_placement_dates check (ends_at > starts_at)
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  sender_user_id uuid references public.users(id) on delete set null,
  full_name text not null,
  email citext not null,
  mobile text,
  event_type text,
  event_date date,
  location_text text,
  required_service text,
  estimated_budget_min numeric(12,2),
  estimated_budget_max numeric(12,2),
  project_details text not null,
  preferred_contact_method text,
  status public.inquiry_status not null default 'new',
  spam_score numeric(5,2) not null default 0,
  consent_at timestamptz not null default now(),
  opened_at timestamptz,
  replied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  reviewer_user_id uuid not null references public.users(id) on delete restrict,
  inquiry_id uuid references public.inquiries(id) on delete set null,
  overall_rating smallint not null check (overall_rating between 1 and 5),
  professionalism smallint check (professionalism between 1 and 5),
  communication smallint check (communication between 1 and 5),
  quality smallint check (quality between 1 and 5),
  timeliness smallint check (timeliness between 1 and 5),
  value_rating smallint check (value_rating between 1 and 5),
  written_review text not null,
  project_date date,
  service_received text,
  is_verified_transaction boolean not null default false,
  status public.review_status not null default 'pending',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id, reviewer_user_id, inquiry_id)
);

create table public.review_replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null unique references public.reviews(id) on delete cascade,
  author_user_id uuid not null references public.users(id) on delete restrict,
  reply_text text not null,
  status public.review_status not null default 'pending',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_profile_id uuid references public.profiles(id) on delete set null,
  submitted_by uuid references public.users(id) on delete set null,
  name text not null,
  slug text not null unique,
  organization_name text,
  description text,
  event_type text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  application_deadline timestamptz,
  location_id uuid references public.locations(id) on delete restrict,
  venue_name text,
  official_url text,
  organizer_email citext,
  organizer_mobile text,
  featured_image_url text,
  status public.event_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.featured_placements
  add constraint featured_event_fk foreign key (event_id) references public.events(id) on delete cascade;

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid references public.users(id) on delete set null,
  title text not null,
  slug text not null unique,
  excerpt text,
  body jsonb not null default '{}'::jsonb,
  category text,
  featured_image_url text,
  featured_image_alt text,
  status public.content_status not null default 'draft',
  is_sponsored boolean not null default false,
  sponsor_name text,
  published_at timestamptz,
  updated_public_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_document tsvector generated always as (
    to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(excerpt,''))
  ) stored
);

create table public.article_profiles (
  article_id uuid not null references public.articles(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  relationship_type text not null default 'related',
  primary key(article_id, profile_id)
);

create table public.article_categories (
  article_id uuid not null references public.articles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key(article_id, category_id)
);

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  badge_type text not null check (badge_type in ('verification','membership','commercial','editorial','status')),
  icon_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profile_badges (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  awarded_by uuid references public.users(id) on delete set null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  public_note text,
  primary key(profile_id, badge_id, starts_at)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references public.users(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete cascade,
  review_id uuid references public.reviews(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  report_type text not null,
  details text not null,
  evidence_paths text[] not null default '{}',
  status public.report_status not null default 'submitted',
  assigned_to uuid references public.users(id) on delete set null,
  resolution_summary text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_target check ((profile_id is not null)::int + (review_id is not null)::int + (event_id is not null)::int >= 1)
);

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  complainant_user_id uuid references public.users(id) on delete set null,
  category text not null,
  details text not null,
  status public.report_status not null default 'submitted',
  business_response text,
  moderator_notes text,
  resolution_summary text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  notification_type public.notification_type not null,
  title text not null,
  body text,
  action_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.analytics_events (
  id bigint generated always as identity primary key,
  event_name text not null,
  user_id uuid references public.users(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete cascade,
  article_id uuid references public.articles(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  session_hash text,
  source text,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table public.data_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  email citext not null,
  request_type text not null check (request_type in ('access','correction','deletion','portability','restriction')),
  status text not null default 'submitted',
  request_details text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- High-impact indexes
create index profiles_search_idx on public.profiles using gin(search_document);
create index profiles_public_discovery_idx on public.profiles(status, primary_category_id, primary_location_id, average_rating desc, updated_at desc)
  where status not in ('suspended','archived');
create index profiles_verified_idx on public.profiles(primary_category_id, primary_location_id, average_rating desc)
  where verification_status = 'verified' and status not in ('suspended','archived');
create index profile_categories_category_idx on public.profile_categories(category_id, profile_id);
create index service_areas_location_idx on public.service_areas(location_id, profile_id);
create index portfolio_profile_sort_idx on public.portfolio_items(profile_id, is_featured desc, sort_order, created_at desc);
create index inquiries_owner_queue_idx on public.inquiries(profile_id, status, created_at desc);
create index reviews_public_idx on public.reviews(profile_id, published_at desc) where status = 'published';
create index events_public_idx on public.events(starts_at, location_id) where status = 'published';
create index articles_search_idx on public.articles using gin(search_document);
create index articles_public_idx on public.articles(published_at desc) where status = 'published';
create index placements_active_idx on public.featured_placements(placement_type, starts_at, ends_at) where is_active;
create index analytics_profile_time_idx on public.analytics_events(profile_id, occurred_at desc);
create index notifications_unread_idx on public.notifications(user_id, created_at desc) where read_at is null;
create index audit_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);

-- Shared updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare t text;
begin
  foreach t in array array['users','categories','businesses','profiles','services','packages','claims','verification_requests','subscriptions','inquiries','reviews','review_replies','events','articles','reports','complaints']
  loop execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t); end loop;
end $$;

-- Authorization helpers
create or replace function public.current_role()
returns public.app_role language sql stable security invoker set search_path = '' as $$
  select case
    when ((select auth.jwt()) -> 'app_metadata' ->> 'role') in
      ('professional_owner','editor','verifier','moderator','admin','super_admin')
    then (((select auth.jwt()) -> 'app_metadata' ->> 'role')::public.app_role)
    else 'user'::public.app_role
  end
$$;

create or replace function public.is_admin()
returns boolean language sql stable security invoker set search_path = '' as $$
  select public.current_role() in ('admin','super_admin')
$$;

create or replace function public.can_moderate()
returns boolean language sql stable security invoker set search_path = '' as $$
  select public.current_role() in ('moderator','admin','super_admin')
$$;

create or replace function public.owns_profile(profile_uuid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1
    from public.profiles p
    where p.id = profile_uuid and p.owner_user_id = (select auth.uid())
  )
$$;

revoke all on function public.owns_profile(uuid) from public;
grant execute on function public.owns_profile(uuid) to anon, authenticated;

-- Row-level security
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.services enable row level security;
alter table public.packages enable row level security;
alter table public.claims enable row level security;
alter table public.verification_requests enable row level security;
alter table public.verification_documents enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.inquiries enable row level security;
alter table public.reviews enable row level security;
alter table public.review_replies enable row level security;
alter table public.events enable row level security;
alter table public.articles enable row level security;
alter table public.reports enable row level security;
alter table public.complaints enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.data_requests enable row level security;

create policy users_self_select on public.users for select using (id = (select auth.uid()) or public.is_admin());
create policy users_self_update on public.users for update using (id = (select auth.uid()) or public.is_admin()) with check (id = (select auth.uid()) or public.is_admin());

create policy public_profiles_select on public.profiles for select using (
  (status in ('basic','verified','professional','featured','founding_member') and published_at is not null)
  or public.owns_profile(id)
  or public.is_admin()
);
create policy owner_profiles_update on public.profiles for update using (public.owns_profile(id) or public.is_admin()) with check (public.owns_profile(id) or public.is_admin());
create policy admin_profiles_insert on public.profiles for insert with check (public.is_admin());

create policy public_portfolio_select on public.portfolio_items for select using (exists(select 1 from public.profiles p where p.id=profile_id and p.status in ('basic','verified','professional','featured','founding_member') and p.published_at is not null) or public.owns_profile(profile_id) or public.is_admin());
create policy owner_portfolio_all on public.portfolio_items for all using (public.owns_profile(profile_id) or public.is_admin()) with check (public.owns_profile(profile_id) or public.is_admin());
create policy public_services_select on public.services for select using ((is_active and exists(select 1 from public.profiles p where p.id=profile_id and p.status in ('basic','verified','professional','featured','founding_member') and p.published_at is not null)) or public.owns_profile(profile_id) or public.is_admin());
create policy owner_services_all on public.services for all using (public.owns_profile(profile_id) or public.is_admin()) with check (public.owns_profile(profile_id) or public.is_admin());
create policy public_packages_select on public.packages for select using ((is_active and exists(select 1 from public.profiles p where p.id=profile_id and p.status in ('basic','verified','professional','featured','founding_member') and p.published_at is not null)) or public.owns_profile(profile_id) or public.is_admin());
create policy owner_packages_all on public.packages for all using (public.owns_profile(profile_id) or public.is_admin()) with check (public.owns_profile(profile_id) or public.is_admin());

create policy claimant_claims_select on public.claims for select using (claimant_user_id=auth.uid() or public.is_admin());
create policy claimant_claims_insert on public.claims for insert with check (claimant_user_id=auth.uid());
create policy claimant_claims_update on public.claims for update
using ((claimant_user_id=(select auth.uid()) and status in ('draft','revision_requested')) or public.is_admin())
with check ((claimant_user_id=(select auth.uid()) and status in ('draft','submitted','revision_requested')) or public.is_admin());

create policy verification_owner_select on public.verification_requests for select using (requested_by=auth.uid() or public.owns_profile(profile_id) or public.is_admin());
create policy verification_owner_insert on public.verification_requests for insert with check (requested_by=auth.uid() and public.owns_profile(profile_id));
create policy verification_owner_or_admin_update on public.verification_requests for update
using (((requested_by=(select auth.uid()) or public.owns_profile(profile_id)) and status in ('draft','revision_requested')) or public.is_admin())
with check (((requested_by=(select auth.uid()) or public.owns_profile(profile_id)) and status in ('draft','submitted','revision_requested')) or public.is_admin());

-- Private verification documents: no public policy. Owners see only their request/claim files; admins/verifiers see all.
create policy verification_docs_owner_select on public.verification_documents for select using (
  public.is_admin() or public.current_role()='verifier' or
  exists(select 1 from public.verification_requests vr where vr.id=verification_request_id and (vr.requested_by=auth.uid() or public.owns_profile(vr.profile_id))) or
  exists(select 1 from public.claims c where c.id=claim_id and c.claimant_user_id=auth.uid())
);
create policy verification_docs_owner_insert on public.verification_documents for insert with check (
  uploaded_by=(select auth.uid())
  and reviewed_by is null
  and review_status='pending'
  and rejection_reason is null
  and (
    exists(select 1 from public.verification_requests vr where vr.id=verification_request_id and (vr.requested_by=(select auth.uid()) or public.owns_profile(vr.profile_id)))
    or exists(select 1 from public.claims c where c.id=claim_id and c.claimant_user_id=(select auth.uid()))
  )
);

create policy subscriptions_owner_select on public.subscriptions for select using (public.owns_profile(profile_id) or public.is_admin());
create policy payments_owner_select on public.payments for select using ((profile_id is not null and public.owns_profile(profile_id)) or public.is_admin());

create policy inquiry_sender_insert on public.inquiries for insert with check (sender_user_id is null or sender_user_id=auth.uid());
create policy inquiry_participants_select on public.inquiries for select using (sender_user_id=auth.uid() or public.owns_profile(profile_id) or public.is_admin());
create policy inquiry_owner_update on public.inquiries for update using (public.owns_profile(profile_id) or public.is_admin());

create policy public_reviews_select on public.reviews for select using (status='published' or reviewer_user_id=auth.uid() or public.owns_profile(profile_id) or public.can_moderate());
create policy reviewer_reviews_insert on public.reviews for insert with check (
  reviewer_user_id=(select auth.uid())
  and inquiry_id is not null
  and status='pending'
  and is_verified_transaction=false
  and published_at is null
  and exists(
    select 1 from public.inquiries i
    where i.id=inquiry_id
      and i.profile_id=profile_id
      and i.sender_user_id=(select auth.uid())
      and i.status in ('replied','qualified','booked','closed')
  )
);
create policy moderator_reviews_update on public.reviews for update using (public.can_moderate()) with check (public.can_moderate());
create policy public_review_replies_select on public.review_replies for select using (status='published' or author_user_id=auth.uid() or public.can_moderate());
create policy owner_review_replies_insert on public.review_replies for insert with check (
  author_user_id=(select auth.uid())
  and status='pending'
  and published_at is null
  and exists(select 1 from public.reviews r where r.id=review_id and public.owns_profile(r.profile_id))
);

create policy public_events_select on public.events for select using (status='published' or submitted_by=auth.uid() or public.is_admin());
create policy user_events_insert on public.events for insert with check (submitted_by=auth.uid());
create policy submitter_events_update on public.events for update
using ((submitted_by=(select auth.uid()) and status in ('draft','pending')) or public.is_admin())
with check ((submitted_by=(select auth.uid()) and status in ('draft','pending')) or public.is_admin());
create policy public_articles_select on public.articles for select using (status='published' or author_user_id=auth.uid() or public.current_role() in ('editor','admin','super_admin'));
create policy editorial_articles_all on public.articles for all using (public.current_role() in ('editor','admin','super_admin')) with check (public.current_role() in ('editor','admin','super_admin'));

create policy reporter_reports_select on public.reports for select using (reporter_user_id=auth.uid() or public.can_moderate());
create policy user_reports_insert on public.reports for insert with check (reporter_user_id is null or reporter_user_id=auth.uid());
create policy moderator_reports_update on public.reports for update using (public.can_moderate());
create policy complaint_parties_select on public.complaints for select using (complainant_user_id=auth.uid() or public.owns_profile(profile_id) or public.can_moderate());
create policy user_complaints_insert on public.complaints for insert with check (complainant_user_id is null or complainant_user_id=auth.uid());
create policy complaint_response_update on public.complaints for update using (public.owns_profile(profile_id) or public.can_moderate());

create policy notification_self_select on public.notifications for select using (user_id=auth.uid());
create policy notification_self_update on public.notifications for update using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy audit_admin_select on public.audit_logs for select using (public.is_admin());
create policy data_request_self_select on public.data_requests for select using (user_id=auth.uid() or public.is_admin());
create policy data_request_insert on public.data_requests for insert with check (user_id is null or user_id=auth.uid());

-- Column privileges keep owner-editable data separate from trust and moderation fields.
-- Administrative trust transitions must run through a reviewed server-side operation.
revoke update on public.users from authenticated;
grant update (full_name, mobile, avatar_url, consent_terms_at, consent_privacy_at) on public.users to authenticated;

revoke update on public.profiles from authenticated;
grant update (
  primary_category_id, primary_location_id, slug, public_name, headline, biography,
  logo_url, cover_url, email, mobile, website_url, social_links, business_hours,
  years_experience, languages, starting_rate, price_range_min, price_range_max,
  accepts_nationwide, available_for_travel, last_active_at, last_public_update_at
) on public.profiles to authenticated;

revoke update on public.verification_requests from authenticated;
grant update (category_id, status, evidence_summary, submitted_at) on public.verification_requests to authenticated;

revoke update on public.reviews from authenticated;
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

-- Storage recommendations (configure in Supabase dashboard or migrations):
-- public buckets: profile-logos, profile-portfolios, article-images, event-images
-- private bucket: verification-documents
-- Enforce MIME allowlists, file-size limits, generated paths, malware scanning, and signed URLs for private files.

-- Seed private pricing-plan configuration
insert into public.subscription_plans(code,name,amount,billing_interval,features) values
('free','Free Listing',0,'year','["Basic directory visibility","One contact link"]'),
('verified','Verified Listing',4900,'year','["Verified badge","Full profile","Portfolio","Review eligibility"]'),
('professional','Professional Listing',12000,'year','["Expanded portfolio","Videos","Analytics","Enhanced inquiry tools"]'),
('featured','Featured Placement',5000,'month','["Clearly labeled priority visibility","Campaign analytics"]')
on conflict (code) do nothing;
