-- v2.2 Phase 7: Streak feature
-- Tracks per-user daily activity (posts / reactions) in Asia/Tokyo timezone.

create table if not exists public.user_daily_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_date date not null,
  posted_count int not null default 0,
  reacted_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, activity_date)
);

create index if not exists idx_user_daily_activity_user_date
  on public.user_daily_activity(user_id, activity_date desc);

alter table public.user_daily_activity enable row level security;

drop policy if exists "activity_select_own" on public.user_daily_activity;
create policy "activity_select_own"
  on public.user_daily_activity for select
  to authenticated
  using (user_id = auth.uid());

-- ================================================================
-- Triggers: record activity on post insert and reaction insert
-- NOTE: our posts table uses `author_id`, not `user_id` like the spec.
-- ================================================================

create or replace function public.record_post_activity()
returns trigger as $$
begin
  insert into public.user_daily_activity (user_id, activity_date, posted_count)
  values (new.author_id, (new.created_at at time zone 'Asia/Tokyo')::date, 1)
  on conflict (user_id, activity_date)
  do update set posted_count = public.user_daily_activity.posted_count + 1,
                updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_record_post_activity on public.posts;
create trigger trg_record_post_activity
  after insert on public.posts
  for each row execute function public.record_post_activity();

create or replace function public.record_reaction_activity()
returns trigger as $$
begin
  insert into public.user_daily_activity (user_id, activity_date, reacted_count)
  values (new.user_id, (new.created_at at time zone 'Asia/Tokyo')::date, 1)
  on conflict (user_id, activity_date)
  do update set reacted_count = public.user_daily_activity.reacted_count + 1,
                updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_record_reaction_activity on public.post_reactions;
create trigger trg_record_reaction_activity
  after insert on public.post_reactions
  for each row execute function public.record_reaction_activity();

-- ================================================================
-- Streak RPC
-- ================================================================

create or replace function public.get_user_streak(p_user_id uuid)
returns table(
  current_streak int,
  longest_streak int,
  last_7_days jsonb
) as $$
declare
  v_current_streak int := 0;
  v_longest_streak int := 0;
  v_today date := (now() at time zone 'Asia/Tokyo')::date;
  v_check_date date := v_today;
  v_has_activity boolean;
  v_last_7 jsonb;
  v_first_check boolean := true;
begin
  -- Current streak: walk backwards from today. If today has no activity,
  -- allow starting from yesterday once.
  loop
    select exists(
      select 1 from public.user_daily_activity
      where user_id = p_user_id
        and activity_date = v_check_date
        and (posted_count > 0 or reacted_count > 0)
    ) into v_has_activity;

    if v_has_activity then
      v_current_streak := v_current_streak + 1;
      v_check_date := v_check_date - interval '1 day';
      v_first_check := false;
    else
      if v_first_check and v_check_date = v_today then
        v_check_date := v_check_date - interval '1 day';
        v_first_check := false;
        continue;
      end if;
      exit;
    end if;
  end loop;

  -- Longest streak (island-style aggregation)
  select coalesce(max(streak_length), 0) into v_longest_streak from (
    select count(*) as streak_length from (
      select activity_date,
             activity_date - (row_number() over (order by activity_date))::int * interval '1 day' as grp
      from public.user_daily_activity
      where user_id = p_user_id and (posted_count > 0 or reacted_count > 0)
    ) t group by grp
  ) s;

  -- Last 7 days summary
  select jsonb_agg(
           jsonb_build_object(
             'date', to_char(d, 'YYYY-MM-DD'),
             'posted', coalesce(posted_count, 0),
             'reacted', coalesce(reacted_count, 0)
           ) order by d
         )
    into v_last_7
  from (
    select generate_series(v_today - interval '6 days', v_today, interval '1 day')::date as d
  ) dates
  left join public.user_daily_activity a
    on a.user_id = p_user_id and a.activity_date = dates.d;

  return query select v_current_streak, v_longest_streak, coalesce(v_last_7, '[]'::jsonb);
end;
$$ language plpgsql stable;
