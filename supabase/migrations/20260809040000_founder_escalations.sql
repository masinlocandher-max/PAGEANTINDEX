-- Owner-light PageantIndex founder escalation queue.
-- Routine support and ordinary review work must not be inserted here.

create table if not exists public.founder_escalations (
  id uuid primary key default gen_random_uuid(),
  escalation_type text not null
    check (escalation_type in ('strategic','legal','security','reputation','enterprise','financial','other')),
  severity text not null default 'medium'
    check (severity in ('low','medium','high','critical')),
  title text not null check (char_length(title) between 3 and 220),
  summary text check (summary is null or char_length(summary) <= 4000),
  source_type text check (source_type is null or char_length(source_type) <= 120),
  source_id uuid,
  status text not null default 'open'
    check (status in ('open','acknowledged','resolved','dismissed')),
  due_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists founder_escalations_open_idx
  on public.founder_escalations (status, severity, created_at desc);

alter table public.founder_escalations enable row level security;
revoke all on public.founder_escalations from anon, authenticated;
grant select (
  id, escalation_type, severity, title, summary, source_type, source_id,
  status, due_at, resolved_at, created_at, updated_at
) on public.founder_escalations to authenticated;
grant all on public.founder_escalations to service_role;

create policy "Only protected admins read founder escalations"
on public.founder_escalations
for select
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

comment on table public.founder_escalations is
  'Founder-only exception queue. Use only for strategic, legal, security, reputation, enterprise, financial, or comparable escalations; never routine operations.';
