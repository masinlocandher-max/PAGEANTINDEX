-- Defense in depth for founder integration secrets.
-- Browser roles have no table grants, and this policy also denies every row.

create policy "Founder integrations deny browser access"
on public.founder_integrations
for all
to anon, authenticated
using (false)
with check (false);
