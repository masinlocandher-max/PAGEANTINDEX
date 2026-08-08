-- Founder-only integration credentials for PageantIndex Command Center.
-- Tokens are encrypted by server-side application code before storage.

create table if not exists public.founder_integrations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('google_gmail')),
  status text not null default 'not_connected'
    check (status in ('not_connected','connected','revoked','error')),
  account_email citext,
  encrypted_refresh_token text,
  token_iv text,
  scope text,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, provider),
  constraint connected_google_requires_secret check (
    status <> 'connected'
    or (encrypted_refresh_token is not null and token_iv is not null)
  )
);

alter table public.founder_integrations enable row level security;
revoke all on public.founder_integrations from anon, authenticated;
grant all on public.founder_integrations to service_role;

comment on table public.founder_integrations is
  'Server-only encrypted founder integration credentials. Never expose refresh-token columns to browser clients.';
