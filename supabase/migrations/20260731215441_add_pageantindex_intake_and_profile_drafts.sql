-- Canonical PageantIndex phase-one workflow tables.
-- Public discovery continues to read only reviewed rows from public.suppliers.

create table public.intake_submissions (
  id uuid primary key default gen_random_uuid(),
  submission_type text not null check (
    submission_type in (
      'inquiry',
      'claim',
      'verification',
      'review',
      'report',
      'advertising',
      'newsletter',
      'professional_invitation',
      'event',
      'membership_interest'
    )
  ),
  supplier_id uuid references public.suppliers(id) on delete set null,
  submitted_by uuid default auth.uid() references auth.users(id) on delete set null,
  contact_name text check (contact_name is null or char_length(contact_name) between 2 and 160),
  contact_email text check (contact_email is null or char_length(contact_email) between 5 and 320),
  contact_mobile text check (contact_mobile is null or char_length(contact_mobile) between 5 and 40),
  payload jsonb not null default '{}'::jsonb check (
    jsonb_typeof(payload) = 'object'
    and octet_length(payload::text) <= 32768
  ),
  status text not null default 'pending' check (
    status in ('pending', 'in_review', 'resolved', 'rejected', 'spam')
  ),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index intake_submissions_queue_idx
  on public.intake_submissions (status, created_at);
create index intake_submissions_supplier_idx
  on public.intake_submissions (supplier_id, created_at desc)
  where supplier_id is not null;

alter table public.intake_submissions enable row level security;

revoke all on public.intake_submissions from anon, authenticated;
grant insert (
  submission_type,
  supplier_id,
  contact_name,
  contact_email,
  contact_mobile,
  payload
) on public.intake_submissions to anon, authenticated;
grant select on public.intake_submissions to authenticated;
grant update (status, reviewed_by, reviewed_at)
  on public.intake_submissions to authenticated;

create policy "Public can create pending intake"
on public.intake_submissions
for insert
to anon, authenticated
with check (
  status = 'pending'
  and submitted_by is not distinct from (select auth.uid())
  and reviewed_by is null
  and reviewed_at is null
);

create policy "Admins read intake"
on public.intake_submissions
for select
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins update intake"
on public.intake_submissions
for update
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create table public.professional_profile_drafts (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  business_name text not null default '' check (char_length(business_name) <= 160),
  category text check (category is null or char_length(category) <= 120),
  location text check (location is null or char_length(location) <= 180),
  public_email text check (public_email is null or char_length(public_email) <= 320),
  about text check (about is null or char_length(about) <= 5000),
  services text check (services is null or char_length(services) <= 5000),
  coverage text check (coverage is null or char_length(coverage) <= 120),
  official_link text check (official_link is null or char_length(official_link) <= 2048),
  portfolio_manifest jsonb not null default '[]'::jsonb check (
    jsonb_typeof(portfolio_manifest) = 'array'
    and octet_length(portfolio_manifest::text) <= 131072
  ),
  submission_state text not null default 'draft' check (
    submission_state in ('draft', 'submitted')
  ),
  review_state text not null default 'pending' check (
    review_state in ('pending', 'in_review', 'changes_requested', 'approved', 'rejected')
  ),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.prepare_professional_profile_draft()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  if new.submission_state = 'submitted'
    and (tg_op = 'INSERT' or old.submission_state is distinct from 'submitted') then
    new.submitted_at = now();
  elsif new.submission_state = 'draft' then
    new.submitted_at = null;
  end if;
  return new;
end;
$$;

create trigger professional_profile_drafts_prepare
before insert or update on public.professional_profile_drafts
for each row execute function public.prepare_professional_profile_draft();

alter table public.professional_profile_drafts enable row level security;

revoke all on public.professional_profile_drafts from anon, authenticated;
grant select on public.professional_profile_drafts to authenticated;
grant insert (
  user_id,
  business_name,
  category,
  location,
  public_email,
  about,
  services,
  coverage,
  official_link,
  portfolio_manifest,
  submission_state
) on public.professional_profile_drafts to authenticated;
grant update (
  user_id,
  business_name,
  category,
  location,
  public_email,
  about,
  services,
  coverage,
  official_link,
  portfolio_manifest,
  submission_state
) on public.professional_profile_drafts to authenticated;

create policy "Professionals read their own draft"
on public.professional_profile_drafts
for select
to authenticated
using (
  user_id = (select auth.uid())
  or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

create policy "Professionals create their own draft"
on public.professional_profile_drafts
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and review_state = 'pending'
);

create policy "Professionals update their own draft"
on public.professional_profile_drafts
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'pageant-profile-drafts',
  'pageant-profile-drafts',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Professionals upload their own draft assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'pageant-profile-drafts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Professionals read their own draft assets"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'pageant-profile-drafts'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  )
);

create policy "Professionals delete their own draft assets"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'pageant-profile-drafts'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  )
);
