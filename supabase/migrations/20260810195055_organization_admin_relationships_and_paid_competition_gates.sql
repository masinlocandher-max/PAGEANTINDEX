create table if not exists public.user_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('professional','candidate','organizer','media','enthusiast','judge','tabulator')),
  source text not null default 'self' check (source in ('self','organization_invite','pageantindex')),
  source_organization_id uuid,
  status text not null default 'active' check (status in ('active','revoked')),
  created_at timestamptz not null default now(),
  unique(user_id, role, source, source_organization_id)
);

create table if not exists public.pageant_organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  organization_name text not null check (char_length(organization_name) between 2 and 220),
  organization_type text,
  official_url text,
  public_email text,
  bio text,
  country_code text,
  country_name text,
  city text,
  region text,
  status text not null default 'unclaimed' check (status in ('unclaimed','claimed','suspended','archived')),
  primary_admin_user_id uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  published_at timestamptz,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_role_assignments drop constraint if exists user_role_assignments_source_organization_id_fkey;
alter table public.user_role_assignments add constraint user_role_assignments_source_organization_id_fkey foreign key (source_organization_id) references public.pageant_organizations(id) on delete cascade;

create table if not exists public.organization_admin_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.pageant_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  admin_sequence integer not null check (admin_sequence >= 1),
  membership_role text not null default 'admin' check (membership_role = 'admin'),
  status text not null default 'active' check (status in ('active','revoked')),
  authority_source text not null default 'organization_invite' check (authority_source in ('founder_claim','organization_invite')),
  organization_verification_state text not null default 'verified_by_organization' check (organization_verification_state = 'verified_by_organization'),
  organization_verified_at timestamptz not null default now(),
  invited_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, user_id),
  unique(organization_id, admin_sequence)
);

create table if not exists public.organization_admin_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.pageant_organizations(id) on delete cascade,
  invite_email text not null,
  invite_kind text not null check (invite_kind in ('founder_claim','admin_invite')),
  token_hash text not null unique,
  invited_by_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  expires_at timestamptz not null,
  accepted_by_user_id uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists organization_one_pending_founder_claim on public.organization_admin_invites(organization_id) where invite_kind='founder_claim' and status='pending';

create table if not exists public.paid_feature_entitlements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.pageant_organizations(id) on delete cascade,
  organizer_user_id uuid references auth.users(id) on delete cascade,
  feature text not null check (feature in ('voting','tabulation')),
  status text not null default 'locked' check (status in ('locked','active','suspended','expired')),
  fee_amount_minor bigint check (fee_amount_minor is null or fee_amount_minor >= 0),
  currency text not null default 'PHP',
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','waived')),
  commercial_reference text,
  activated_by_user_id uuid references auth.users(id) on delete set null,
  activated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((organization_id is not null and organizer_user_id is null) or (organization_id is null and organizer_user_id is not null))
);
create unique index if not exists paid_feature_org_unique on public.paid_feature_entitlements(organization_id,feature) where organization_id is not null;
create unique index if not exists paid_feature_organizer_unique on public.paid_feature_entitlements(organizer_user_id,feature) where organizer_user_id is not null;

alter table public.pageant_edition_drafts add column if not exists organization_id uuid references public.pageant_organizations(id) on delete set null;
create index if not exists pageant_edition_drafts_organization_idx on public.pageant_edition_drafts(organization_id);

create or replace function public.pageantindex_is_organization_admin(target_organization uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from public.organization_admin_memberships m
    where m.organization_id = target_organization
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;
revoke all on function public.pageantindex_is_organization_admin(uuid) from public, anon;
grant execute on function public.pageantindex_is_organization_admin(uuid) to authenticated, service_role;

create or replace function public.pageantindex_is_organizer()
returns boolean language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.account_type='organizer'
  ) or exists (
    select 1 from public.user_role_assignments r where r.user_id=(select auth.uid()) and r.role='organizer' and r.status='active'
  ) or exists (
    select 1 from public.organization_admin_memberships m where m.user_id=(select auth.uid()) and m.status='active'
  );
$$;
revoke all on function public.pageantindex_is_organizer() from public, anon;
grant execute on function public.pageantindex_is_organizer() to authenticated, service_role;

create or replace function public.pageantindex_can_manage_edition(target_edition uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from public.pageant_edition_drafts e
    where e.id=target_edition and (
      e.organizer_user_id=(select auth.uid())
      or (e.organization_id is not null and exists (
        select 1 from public.organization_admin_memberships m
        where m.organization_id=e.organization_id and m.user_id=(select auth.uid()) and m.status='active'
      ))
      or ((((select auth.jwt())->'app_metadata'->>'role')='admin'))
    )
  );
$$;
revoke all on function public.pageantindex_can_manage_edition(uuid) from public, anon;
grant execute on function public.pageantindex_can_manage_edition(uuid) to authenticated, service_role;

create or replace function public.pageantindex_feature_active(target_feature text, target_organization uuid, target_organizer uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from public.paid_feature_entitlements e
    where e.feature=target_feature and e.status='active' and e.payment_status in ('paid','waived')
      and (e.expires_at is null or e.expires_at>now())
      and ((target_organization is not null and e.organization_id=target_organization)
        or (target_organization is null and e.organizer_user_id=target_organizer))
  );
$$;
revoke all on function public.pageantindex_feature_active(text,uuid,uuid) from public, anon;
grant execute on function public.pageantindex_feature_active(text,uuid,uuid) to authenticated, service_role;

create or replace function private.pageantindex_seed_paid_features()
returns trigger language plpgsql set search_path='' as $$
begin
  insert into public.paid_feature_entitlements(organization_id,feature) values (new.id,'voting'),(new.id,'tabulation') on conflict do nothing;
  return new;
end; $$;
drop trigger if exists pageantindex_seed_org_paid_features on public.pageant_organizations;
create trigger pageantindex_seed_org_paid_features after insert on public.pageant_organizations for each row execute function private.pageantindex_seed_paid_features();

create or replace function private.pageantindex_seed_organizer_paid_features()
returns trigger language plpgsql set search_path='' as $$
begin
  if new.role='organizer' and new.status='active' then
    insert into public.paid_feature_entitlements(organizer_user_id,feature) values (new.user_id,'voting'),(new.user_id,'tabulation') on conflict do nothing;
  end if;
  return new;
end; $$;
drop trigger if exists pageantindex_seed_organizer_paid_features on public.user_role_assignments;
create trigger pageantindex_seed_organizer_paid_features after insert or update on public.user_role_assignments for each row execute function private.pageantindex_seed_organizer_paid_features();

create or replace function private.pageantindex_guard_paid_competition_feature()
returns trigger language plpgsql set search_path='' as $$
declare
  org_id uuid;
  owner_id uuid;
  needed_feature text;
begin
  select e.organization_id,e.organizer_user_id into org_id,owner_id from public.pageant_edition_drafts e where e.id=new.edition_id;
  needed_feature := case when tg_table_name='voting_events' then 'voting' else 'tabulation' end;
  if not public.pageantindex_feature_active(needed_feature,org_id,owner_id) then
    raise exception '% is a paid PageantIndex feature and is locked until founder activation.', initcap(needed_feature) using errcode='42501';
  end if;
  return new;
end; $$;
drop trigger if exists pageantindex_require_voting_activation on public.voting_events;
create trigger pageantindex_require_voting_activation before insert or update of edition_id on public.voting_events for each row execute function private.pageantindex_guard_paid_competition_feature();
drop trigger if exists pageantindex_require_tabulation_activation on public.tabulation_events;
create trigger pageantindex_require_tabulation_activation before insert or update of edition_id on public.tabulation_events for each row execute function private.pageantindex_guard_paid_competition_feature();

create or replace function public.pageantindex_accept_organization_invite(p_token_hash text,p_user_id uuid,p_email text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  inv public.organization_admin_invites%rowtype;
  org public.pageant_organizations%rowtype;
  seq integer;
begin
  select * into inv from public.organization_admin_invites where token_hash=p_token_hash and status='pending' for update;
  if inv.id is null then raise exception 'Invitation is invalid or no longer available.'; end if;
  if inv.expires_at<=now() then update public.organization_admin_invites set status='expired' where id=inv.id; raise exception 'Invitation has expired.'; end if;
  if lower(inv.invite_email)<>lower(p_email) then raise exception 'This invitation was issued to a different email address.'; end if;
  if not exists(select 1 from public.member_privacy_acknowledgements a where a.user_id=p_user_id) then raise exception 'Member privacy acknowledgement is required before organization access.'; end if;
  select * into org from public.pageant_organizations where id=inv.organization_id for update;
  if inv.invite_kind='founder_claim' and org.status<>'unclaimed' then raise exception 'Organization has already been claimed.'; end if;
  if inv.invite_kind='admin_invite' and org.status<>'claimed' then raise exception 'Organization must be claimed before additional admins can be added.'; end if;
  if inv.invite_kind='founder_claim' then seq:=1; else select coalesce(max(admin_sequence),0)+1 into seq from public.organization_admin_memberships where organization_id=inv.organization_id; end if;
  insert into public.organization_admin_memberships(organization_id,user_id,admin_sequence,authority_source,invited_by_user_id)
    values(inv.organization_id,p_user_id,seq,case when inv.invite_kind='founder_claim' then 'founder_claim' else 'organization_invite' end,inv.invited_by_user_id)
    on conflict(organization_id,user_id) do update set status='active',updated_at=now();
  insert into public.user_role_assignments(user_id,role,source,source_organization_id)
    values(p_user_id,'organizer','organization_invite',inv.organization_id) on conflict do nothing;
  update public.organization_admin_invites set status='accepted',accepted_by_user_id=p_user_id,accepted_at=now() where id=inv.id;
  if inv.invite_kind='founder_claim' then
    update public.pageant_organizations set status='claimed',primary_admin_user_id=p_user_id,claimed_at=now(),updated_at=now() where id=inv.organization_id;
  end if;
  return jsonb_build_object('organization_id',inv.organization_id,'admin_sequence',seq,'organization_verification','verified_by_organization','pageantindex_identity_verification','separate');
end; $$;
revoke all on function public.pageantindex_accept_organization_invite(text,uuid,text) from public, anon, authenticated;
grant execute on function public.pageantindex_accept_organization_invite(text,uuid,text) to service_role;

alter table public.user_role_assignments enable row level security;
alter table public.pageant_organizations enable row level security;
alter table public.organization_admin_memberships enable row level security;
alter table public.organization_admin_invites enable row level security;
alter table public.paid_feature_entitlements enable row level security;

drop policy if exists "Organizers create their organization" on public.pageant_organization_drafts;
drop policy if exists "Organizers update their organization" on public.pageant_organization_drafts;

create policy "Public reads published organizations" on public.pageant_organizations for select to anon using (published_at is not null and status='claimed');
create policy "Members read organizations they administer" on public.pageant_organizations for select to authenticated using (public.pageantindex_is_organization_admin(id) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy "Organization admins update claimed organization" on public.pageant_organizations for update to authenticated using (status='claimed' and public.pageantindex_is_organization_admin(id)) with check (public.pageantindex_is_organization_admin(id));
create policy "Founder manages organizations" on public.pageant_organizations for all to authenticated using ((((select auth.jwt())->'app_metadata'->>'role')='admin')) with check ((((select auth.jwt())->'app_metadata'->>'role')='admin'));

create policy "Users read active roles" on public.user_role_assignments for select to authenticated using (user_id=(select auth.uid()) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy "Organization admins read memberships" on public.organization_admin_memberships for select to authenticated using (user_id=(select auth.uid()) or public.pageantindex_is_organization_admin(organization_id) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy "Users read their feature gates" on public.paid_feature_entitlements for select to authenticated using ((organizer_user_id=(select auth.uid())) or (organization_id is not null and public.pageantindex_is_organization_admin(organization_id)) or (((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy "Founder manages paid feature gates" on public.paid_feature_entitlements for all to authenticated using ((((select auth.jwt())->'app_metadata'->>'role')='admin')) with check ((((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy "Invites deny browser access" on public.organization_admin_invites for all to anon,authenticated using (false) with check (false);

create policy "Organization admins read editions" on public.pageant_edition_drafts for select to authenticated using (organization_id is not null and public.pageantindex_is_organization_admin(organization_id));
create policy "Organization admins create editions" on public.pageant_edition_drafts for insert to authenticated with check (organizer_user_id=(select auth.uid()) and organization_id is not null and public.pageantindex_is_organization_admin(organization_id) and review_state='pending' and published_at is null);
create policy "Organization admins update editions" on public.pageant_edition_drafts for update to authenticated using (organization_id is not null and public.pageantindex_is_organization_admin(organization_id)) with check (organization_id is not null and public.pageantindex_is_organization_admin(organization_id));

create policy "Organization admins manage rosters" on public.pageant_candidate_roster_drafts for all to authenticated using (public.pageantindex_can_manage_edition(edition_id)) with check (organizer_user_id=(select auth.uid()) and public.pageantindex_can_manage_edition(edition_id));
create policy "Organization admins manage results drafts" on public.pageant_result_drafts for all to authenticated using (public.pageantindex_can_manage_edition(edition_id)) with check (organizer_user_id=(select auth.uid()) and public.pageantindex_can_manage_edition(edition_id));
create policy "Organization admins manage experiences" on public.pageant_experience_requests for all to authenticated using (public.pageantindex_can_manage_edition(edition_id)) with check (organizer_user_id=(select auth.uid()) and public.pageantindex_can_manage_edition(edition_id));
create policy "Organization admins manage announcements" on public.organizer_announcement_requests for all to authenticated using (edition_id is null or public.pageantindex_can_manage_edition(edition_id)) with check (organizer_user_id=(select auth.uid()) and (edition_id is null or public.pageantindex_can_manage_edition(edition_id)));
create policy "Organization admins manage voting events" on public.voting_events for all to authenticated using (public.pageantindex_can_manage_edition(edition_id)) with check (organizer_user_id=(select auth.uid()) and public.pageantindex_can_manage_edition(edition_id));
create policy "Organization admins manage voting candidates" on public.voting_candidates for all to authenticated using (exists(select 1 from public.voting_events v where v.id=voting_event_id and public.pageantindex_can_manage_edition(v.edition_id))) with check (exists(select 1 from public.voting_events v where v.id=voting_event_id and public.pageantindex_can_manage_edition(v.edition_id)));
create policy "Organization admins read vote ledger" on public.vote_transactions for select to authenticated using (exists(select 1 from public.voting_events v where v.id=voting_event_id and public.pageantindex_can_manage_edition(v.edition_id)));
create policy "Organization admins manage tabulation events" on public.tabulation_events for all to authenticated using (public.pageantindex_can_manage_edition(edition_id)) with check (public.pageantindex_can_manage_edition(edition_id));
create policy "Organization admins manage judge assignments" on public.judge_assignments for all to authenticated using (exists(select 1 from public.tabulation_events e where e.id=tabulation_event_id and public.pageantindex_can_manage_edition(e.edition_id))) with check (exists(select 1 from public.tabulation_events e where e.id=tabulation_event_id and public.pageantindex_can_manage_edition(e.edition_id)));
create policy "Organization admins manage tabulation segments" on public.tabulation_segments for all to authenticated using (exists(select 1 from public.tabulation_events e where e.id=tabulation_event_id and public.pageantindex_can_manage_edition(e.edition_id))) with check (exists(select 1 from public.tabulation_events e where e.id=tabulation_event_id and public.pageantindex_can_manage_edition(e.edition_id)));
create policy "Organization admins manage tabulation criteria" on public.tabulation_criteria for all to authenticated using (exists(select 1 from public.tabulation_segments s join public.tabulation_events e on e.id=s.tabulation_event_id where s.id=segment_id and public.pageantindex_can_manage_edition(e.edition_id))) with check (exists(select 1 from public.tabulation_segments s join public.tabulation_events e on e.id=s.tabulation_event_id where s.id=segment_id and public.pageantindex_can_manage_edition(e.edition_id)));
create policy "Organization admins read judge scores" on public.judge_scores for select to authenticated using (exists(select 1 from public.tabulation_events e where e.id=tabulation_event_id and public.pageantindex_can_manage_edition(e.edition_id)));
create policy "Organization admins read tabulation results" on public.tabulation_results for select to authenticated using (exists(select 1 from public.tabulation_events e where e.id=tabulation_event_id and public.pageantindex_can_manage_edition(e.edition_id)));

revoke all on public.organization_admin_invites from anon,authenticated;
grant select on public.pageant_organizations,public.organization_admin_memberships,public.user_role_assignments,public.paid_feature_entitlements to authenticated;
grant select on public.pageant_organizations to anon;
grant insert,update on public.pageant_organizations,public.paid_feature_entitlements to authenticated;
