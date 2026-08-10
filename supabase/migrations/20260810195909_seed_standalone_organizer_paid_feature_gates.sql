create or replace function private.pageantindex_seed_profile_organizer_paid_features()
returns trigger language plpgsql set search_path='' as $$
begin
  if new.account_type='organizer' then
    insert into public.paid_feature_entitlements(organizer_user_id,feature)
    values (new.user_id,'voting'),(new.user_id,'tabulation')
    on conflict do nothing;
  end if;
  return new;
end; $$;

drop trigger if exists pageantindex_seed_profile_organizer_paid_features on public.user_profiles;
create trigger pageantindex_seed_profile_organizer_paid_features
after insert or update of account_type on public.user_profiles
for each row execute function private.pageantindex_seed_profile_organizer_paid_features();

insert into public.paid_feature_entitlements(organizer_user_id,feature)
select p.user_id, f.feature
from public.user_profiles p
cross join (values ('voting'::text),('tabulation'::text)) as f(feature)
where p.account_type='organizer'
on conflict do nothing;
