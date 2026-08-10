alter table public.judge_assignments add column expires_at timestamptz null;
create index judge_assignments_invite_expiry_idx on public.judge_assignments(status,expires_at) where status='invited';
