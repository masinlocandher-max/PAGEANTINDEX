alter table public.commerce_orders add column access_token_hash text null;
create unique index commerce_orders_access_token_hash_idx on public.commerce_orders(access_token_hash) where access_token_hash is not null;

alter table public.commerce_access_credentials drop constraint if exists commerce_access_credentials_order_id_credential_type_key;
alter table public.commerce_access_credentials add column credential_index integer not null default 1 check (credential_index>0 and credential_index<=1000);
alter table public.commerce_access_credentials add constraint commerce_access_credentials_order_type_index_key unique(order_id,credential_type,credential_index);

create or replace function private.pageantindex_guard_commerce_credential()
returns trigger language plpgsql set search_path=pg_catalog,public,private
as $$ declare order_offer uuid; order_status text; begin
  select offer_id,status into order_offer,order_status from public.commerce_orders where id=new.order_id;
  if order_offer is distinct from new.offer_id then raise exception 'Commerce credential must belong to the order offer.'; end if;
  if order_status not in ('paid','fulfilled') then raise exception 'Commerce credentials require a paid order.'; end if;
  return new;
end; $$;
revoke all on function private.pageantindex_guard_commerce_credential() from public,anon,authenticated;
create trigger commerce_credentials_guard before insert or update on public.commerce_access_credentials for each row execute function private.pageantindex_guard_commerce_credential();
