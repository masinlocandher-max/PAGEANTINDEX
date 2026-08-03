-- Live PageantIndex administrator review migration.
-- Public RPCs are SECURITY INVOKER wrappers. Privileged implementation lives
-- in a non-exposed schema and validates the protected app_metadata admin role.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.pageantindex_admin_review(
  review_kind text,
  record_id uuid,
  next_review_state text,
  publish_now boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
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

  case review_kind
    when 'media_profile' then
      update public.media_profile_drafts
      set review_state = next_review_state,
          published_at = case
            when next_review_state = 'approved' then coalesce(published_at, now())
            else null
          end,
          updated_at = now()
      where user_id = record_id and submission_state = 'submitted';
      if not found then raise exception 'Submitted media profile not found'; end if;

    when 'media_article' then
      update public.media_articles
      set review_state = next_review_state,
          published_at = case
            when next_review_state = 'approved' and publish_now
              then coalesce(published_at, now())
            when next_review_state <> 'approved' then null
            else published_at
          end,
          updated_at = now()
      where id = record_id and submission_state = 'submitted';
      if not found then raise exception 'Submitted media article not found'; end if;

    when 'organization' then
      update public.pageant_organization_drafts
      set review_state = next_review_state,
          published_at = case
            when next_review_state = 'approved' then coalesce(published_at, now())
            else null
          end,
          updated_at = now()
      where user_id = record_id and submission_state = 'submitted';
      if not found then raise exception 'Submitted pageant organization not found'; end if;

    when 'edition' then
      update public.pageant_edition_drafts
      set review_state = next_review_state,
          published_at = case
            when next_review_state = 'approved' then coalesce(published_at, now())
            else null
          end,
          updated_at = now()
      where id = record_id and submission_state = 'submitted';
      if not found then raise exception 'Submitted pageant edition not found'; end if;

    when 'experience' then
      update public.pageant_experience_requests
      set review_state = next_review_state,
          published_at = case
            when next_review_state = 'approved' then coalesce(published_at, now())
            else null
          end,
          updated_at = now()
      where id = record_id and submission_state = 'submitted';
      if not found then raise exception 'Submitted pageant experience not found'; end if;

    when 'result' then
      update public.pageant_result_drafts
      set review_state = next_review_state,
          published_at = case
            when next_review_state = 'approved' then coalesce(published_at, now())
            else null
          end,
          updated_at = now()
      where id = record_id and submission_state = 'submitted';
      if not found then raise exception 'Submitted pageant result not found'; end if;

    when 'announcement' then
      select * into request_record
      from public.organizer_announcement_requests
      where id = record_id and submission_state = 'submitted'
      for update;
      if not found then
        raise exception 'Submitted announcement request not found';
      end if;

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
              category = 'Official pageant announcement',
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
      where id = record_id;

    else
      raise exception 'Unknown review type';
  end case;

  return announcement_id;
end;
$$;

revoke all on function private.pageantindex_admin_review(text, uuid, text, boolean)
  from public, anon;
grant execute on function private.pageantindex_admin_review(text, uuid, text, boolean)
  to authenticated;

create or replace function public.admin_review_media_profile(
  profile_user_id uuid,
  next_review_state text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.pageantindex_admin_review(
    'media_profile', profile_user_id, next_review_state, false
  );
end;
$$;

create or replace function public.admin_review_media_article(
  article_id uuid,
  next_review_state text,
  publish_now boolean default false
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.pageantindex_admin_review(
    'media_article', article_id, next_review_state, publish_now
  );
end;
$$;

create or replace function public.admin_review_pageant_organization(
  profile_user_id uuid,
  next_review_state text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.pageantindex_admin_review(
    'organization', profile_user_id, next_review_state, false
  );
end;
$$;

create or replace function public.admin_review_pageant_edition(
  edition_id uuid,
  next_review_state text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.pageantindex_admin_review(
    'edition', edition_id, next_review_state, false
  );
end;
$$;

create or replace function public.admin_review_pageant_experience(
  request_id uuid,
  next_review_state text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.pageantindex_admin_review(
    'experience', request_id, next_review_state, false
  );
end;
$$;

create or replace function public.admin_review_pageant_result(
  result_record_id uuid,
  next_review_state text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform private.pageantindex_admin_review(
    'result', result_record_id, next_review_state, false
  );
end;
$$;

create or replace function public.admin_review_organizer_announcement(
  request_id uuid,
  next_review_state text,
  publish_now boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return private.pageantindex_admin_review(
    'announcement', request_id, next_review_state, publish_now
  );
end;
$$;

revoke all on function public.admin_review_media_profile(uuid, text)
  from public, anon;
revoke all on function public.admin_review_media_article(uuid, text, boolean)
  from public, anon;
revoke all on function public.admin_review_pageant_organization(uuid, text)
  from public, anon;
revoke all on function public.admin_review_pageant_edition(uuid, text)
  from public, anon;
revoke all on function public.admin_review_pageant_experience(uuid, text)
  from public, anon;
revoke all on function public.admin_review_pageant_result(uuid, text)
  from public, anon;
revoke all on function public.admin_review_organizer_announcement(uuid, text, boolean)
  from public, anon;

grant execute on function public.admin_review_media_profile(uuid, text)
  to authenticated;
grant execute on function public.admin_review_media_article(uuid, text, boolean)
  to authenticated;
grant execute on function public.admin_review_pageant_organization(uuid, text)
  to authenticated;
grant execute on function public.admin_review_pageant_edition(uuid, text)
  to authenticated;
grant execute on function public.admin_review_pageant_experience(uuid, text)
  to authenticated;
grant execute on function public.admin_review_pageant_result(uuid, text)
  to authenticated;
grant execute on function public.admin_review_organizer_announcement(uuid, text, boolean)
  to authenticated;
