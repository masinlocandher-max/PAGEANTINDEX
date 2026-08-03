-- Align hardened organizer review functions with the parameter names used by PostgREST clients.
-- Apply after 20260803173000_fix_public_pageant_column_grants.sql.

drop function if exists public.admin_review_pageant_edition(uuid, text);
create function public.admin_review_pageant_edition(
  edition_id uuid,
  next_review_state text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') <> 'admin' then
    raise exception 'Administrator access required';
  end if;
  if next_review_state not in ('pending','in_review','changes_requested','approved','rejected') then
    raise exception 'Invalid review state';
  end if;
  update public.pageant_edition_drafts
  set review_state = next_review_state,
      published_at = case when next_review_state = 'approved' then coalesce(published_at, now()) else null end,
      updated_at = now()
  where id = edition_id;
end;
$$;

revoke all on function public.admin_review_pageant_edition(uuid, text) from public;
grant execute on function public.admin_review_pageant_edition(uuid, text) to authenticated;

drop function if exists public.admin_review_pageant_experience(uuid, text);
create function public.admin_review_pageant_experience(
  request_id uuid,
  next_review_state text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') <> 'admin' then
    raise exception 'Administrator access required';
  end if;
  if next_review_state not in ('pending','in_review','changes_requested','approved','rejected') then
    raise exception 'Invalid review state';
  end if;
  update public.pageant_experience_requests
  set review_state = next_review_state,
      published_at = case when next_review_state = 'approved' then coalesce(published_at, now()) else null end,
      updated_at = now()
  where id = request_id;
end;
$$;

revoke all on function public.admin_review_pageant_experience(uuid, text) from public;
grant execute on function public.admin_review_pageant_experience(uuid, text) to authenticated;

drop function if exists public.admin_review_organizer_announcement(uuid, text, boolean);
create function public.admin_review_organizer_announcement(
  request_id uuid,
  next_review_state text,
  publish_now boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request_record public.organizer_announcement_requests%rowtype;
  announcement_id uuid;
begin
  if coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') <> 'admin' then
    raise exception 'Administrator access required';
  end if;
  if next_review_state not in ('pending','in_review','changes_requested','approved','rejected') then
    raise exception 'Invalid review state';
  end if;

  select * into request_record
  from public.organizer_announcement_requests
  where id = request_id
  for update;

  if not found then raise exception 'Announcement request not found'; end if;
  announcement_id := request_record.published_announcement_id;

  if next_review_state = 'approved' and publish_now then
    if announcement_id is null then
      insert into public.announcements (
        title, summary, category, target_url, status, published_at, created_by
      ) values (
        request_record.title,
        request_record.summary,
        'Official pageant announcement',
        request_record.target_url,
        'published',
        now(),
        request_record.organizer_user_id
      ) returning id into announcement_id;
    else
      update public.announcements
      set title = request_record.title,
          summary = request_record.summary,
          target_url = request_record.target_url,
          status = 'published',
          published_at = coalesce(published_at, now()),
          updated_at = now()
      where id = announcement_id;
    end if;
  elsif announcement_id is not null and next_review_state <> 'approved' then
    update public.announcements
    set status = 'archived', updated_at = now()
    where id = announcement_id;
  end if;

  update public.organizer_announcement_requests
  set review_state = next_review_state,
      published_announcement_id = announcement_id,
      updated_at = now()
  where id = request_id;

  return announcement_id;
end;
$$;

revoke all on function public.admin_review_organizer_announcement(uuid, text, boolean) from public;
grant execute on function public.admin_review_organizer_announcement(uuid, text, boolean) to authenticated;
