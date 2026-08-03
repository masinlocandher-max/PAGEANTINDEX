-- Administrator moderation helpers for Pageant Index audience content.
-- Apply after 20260803171000_add_pageant_organizers.sql.

create or replace function public.admin_review_pageant_edition(
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
  set review_state = next_review_state, updated_at = now()
  where id = edition_id;
end;
$$;

revoke all on function public.admin_review_pageant_edition(uuid, text) from public;
grant execute on function public.admin_review_pageant_edition(uuid, text) to authenticated;

create or replace function public.admin_review_pageant_experience(
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
  set review_state = next_review_state, updated_at = now()
  where id = request_id;
end;
$$;

revoke all on function public.admin_review_pageant_experience(uuid, text) from public;
grant execute on function public.admin_review_pageant_experience(uuid, text) to authenticated;

create or replace function public.admin_review_organizer_announcement(
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

  update public.organizer_announcement_requests
  set review_state = next_review_state, updated_at = now()
  where id = request_id;

  if next_review_state = 'approved' and publish_now then
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
  end if;

  return announcement_id;
end;
$$;

revoke all on function public.admin_review_organizer_announcement(uuid, text, boolean) from public;
grant execute on function public.admin_review_organizer_announcement(uuid, text, boolean) to authenticated;
