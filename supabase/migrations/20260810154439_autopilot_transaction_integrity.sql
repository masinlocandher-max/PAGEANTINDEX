create unique index if not exists vote_transactions_payment_once_idx
on public.vote_transactions(payment_transaction_id)
where payment_transaction_id is not null and status in ('pending','confirmed');

create unique index if not exists professional_credits_org_unique_idx
on public.professional_credits(edition_id,supplier_user_id,lower(role))
where candidate_roster_id is null and status <> 'removed';

create unique index if not exists professional_credits_candidate_unique_idx
on public.professional_credits(edition_id,candidate_roster_id,supplier_user_id,lower(role))
where candidate_roster_id is not null and status <> 'removed';

revoke insert, update, delete on public.tabulation_results from authenticated;
drop policy if exists "Organizers and admins manage tabulation results" on public.tabulation_results;
create policy "Admins manage tabulation results" on public.tabulation_results
for all to authenticated
using ((((select auth.jwt())->'app_metadata'->>'role'))='admin')
with check ((((select auth.jwt())->'app_metadata'->>'role'))='admin');
