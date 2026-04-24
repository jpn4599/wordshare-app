-- v2.2 Phase 8: Badges feature
-- Tracks badge definitions + per-user earned badges, with RPCs for
-- checking achievements and returning progress (earned + in-progress).

create table if not exists public.badge_definitions (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null,
  color_scheme text not null,
  condition_type text not null,
  condition_params jsonb not null,
  sort_order int default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id text not null references public.badge_definitions(id),
  earned_at timestamptz not null default now(),
  unique(user_id, badge_id)
);

create index if not exists idx_user_badges_user_id on public.user_badges(user_id);

alter table public.user_badges enable row level security;
alter table public.badge_definitions enable row level security;

drop policy if exists "badges_select_anyone" on public.user_badges;
create policy "badges_select_anyone"
  on public.user_badges for select to authenticated using (true);

drop policy if exists "badge_defs_select_anyone" on public.badge_definitions;
create policy "badge_defs_select_anyone"
  on public.badge_definitions for select to authenticated using (true);

-- Seed badge definitions (idempotent)
insert into public.badge_definitions (id, name, description, icon, color_scheme, condition_type, condition_params, sort_order) values
  ('first_post',    'First Word',    '最初の単語投稿',       '🌱', 'green',  'post_count',    '{"count":1}'::jsonb,                     0),
  ('business_pro',  'Business Pro',  'ビジネスタグ50単語',   '💼', 'teal',   'tag_count',     '{"tag":"ビジネス","count":50}'::jsonb,  10),
  ('traveler',      'Traveler',      '旅行単語5つ登録',      '✈️', 'pink',   'tag_count',     '{"tag":"旅行","count":5}'::jsonb,      20),
  ('example_king',  'Example King',  '例文コメント20回',    '📝', 'amber',  'comment_count', '{"count":20}'::jsonb,                    30),
  ('streak_30',     '30-day Streak', '30日連続アクティブ',  '🔥', 'blue',   'streak',        '{"days":30}'::jsonb,                     40),
  ('poet',          'Poet',          '文学的タグ30単語',     '📚', 'purple', 'tag_count',     '{"tag":"文学的","count":30}'::jsonb,   50),
  ('night_owl',     'Night Owl',     '深夜投稿10回',         '🌙', 'gray',   'time_posting',  '{"hour_start":0,"hour_end":4,"count":10}'::jsonb, 60),
  ('got_it_50',     'Eager Learner', 'Got it! を50回',       '⭐', 'pink',   'reaction_given','{"type":"got_it","count":50}'::jsonb, 70)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  color_scheme = excluded.color_scheme,
  condition_type = excluded.condition_type,
  condition_params = excluded.condition_params,
  sort_order = excluded.sort_order;

-- ================================================================
-- Badge achievement check RPC
-- Adaptations: words → posts, word_tags.word_id → word_tags.post_id,
--              word_reactions → post_reactions, posts.user_id → posts.author_id
-- ================================================================

create or replace function public.check_and_award_badges(p_user_id uuid)
returns table(newly_earned_badge_id text) as $$
declare
  v_badge record;
  v_condition jsonb;
  v_achieved boolean;
  v_count int;
begin
  for v_badge in
    select bd.* from public.badge_definitions bd
    where not exists (
      select 1 from public.user_badges ub
      where ub.user_id = p_user_id and ub.badge_id = bd.id
    )
  loop
    v_condition := v_badge.condition_params;
    v_achieved := false;

    case v_badge.condition_type
      when 'post_count' then
        select count(*)::int into v_count from public.posts where author_id = p_user_id;
        v_achieved := v_count >= (v_condition->>'count')::int;

      when 'tag_count' then
        select count(distinct p.id)::int into v_count
        from public.posts p
        join public.word_tags wt on p.id = wt.post_id
        join public.tags t on wt.tag_id = t.id
        where p.author_id = p_user_id and t.name = v_condition->>'tag';
        v_achieved := v_count >= (v_condition->>'count')::int;

      when 'streak' then
        select (public.get_user_streak(p_user_id)).current_streak into v_count;
        v_achieved := v_count >= (v_condition->>'days')::int;

      when 'reaction_given' then
        select count(*)::int into v_count
        from public.post_reactions
        where user_id = p_user_id and type = v_condition->>'type';
        v_achieved := v_count >= (v_condition->>'count')::int;

      when 'comment_count' then
        select count(*)::int into v_count
        from public.comments
        where author_id = p_user_id;
        v_achieved := v_count >= (v_condition->>'count')::int;

      when 'time_posting' then
        select count(*)::int into v_count
        from public.posts
        where author_id = p_user_id
          and extract(hour from created_at at time zone 'Asia/Tokyo')
            between (v_condition->>'hour_start')::int and (v_condition->>'hour_end')::int - 1;
        v_achieved := v_count >= (v_condition->>'count')::int;

      else
        v_achieved := false;
    end case;

    if v_achieved then
      insert into public.user_badges (user_id, badge_id)
      values (p_user_id, v_badge.id)
      on conflict (user_id, badge_id) do nothing;
      newly_earned_badge_id := v_badge.id;
      return next;
    end if;
  end loop;
end;
$$ language plpgsql security definer;

-- ================================================================
-- Badge progress RPC (earned + in-progress)
-- ================================================================

create or replace function public.get_user_badge_progress(p_user_id uuid)
returns table(
  badge_id text,
  name text,
  description text,
  icon text,
  color_scheme text,
  earned boolean,
  earned_at timestamptz,
  progress int,
  target int
) as $$
declare
  v_badge record;
  v_cond jsonb;
  v_current int;
  v_target int;
  v_earned_at timestamptz;
begin
  for v_badge in select * from public.badge_definitions order by sort_order loop
    v_cond := v_badge.condition_params;

    case v_badge.condition_type
      when 'post_count' then
        select count(*)::int into v_current from public.posts where author_id = p_user_id;
        v_target := (v_cond->>'count')::int;
      when 'tag_count' then
        select count(distinct p.id)::int into v_current
        from public.posts p
        join public.word_tags wt on p.id = wt.post_id
        join public.tags t on wt.tag_id = t.id
        where p.author_id = p_user_id and t.name = v_cond->>'tag';
        v_target := (v_cond->>'count')::int;
      when 'streak' then
        select (public.get_user_streak(p_user_id)).current_streak into v_current;
        v_target := (v_cond->>'days')::int;
      when 'reaction_given' then
        select count(*)::int into v_current
        from public.post_reactions
        where user_id = p_user_id and type = v_cond->>'type';
        v_target := (v_cond->>'count')::int;
      when 'comment_count' then
        select count(*)::int into v_current
        from public.comments
        where author_id = p_user_id;
        v_target := (v_cond->>'count')::int;
      when 'time_posting' then
        select count(*)::int into v_current
        from public.posts
        where author_id = p_user_id
          and extract(hour from created_at at time zone 'Asia/Tokyo')
            between (v_cond->>'hour_start')::int and (v_cond->>'hour_end')::int - 1;
        v_target := (v_cond->>'count')::int;
      else
        v_current := 0;
        v_target := 1;
    end case;

    select ub.earned_at into v_earned_at
    from public.user_badges ub
    where ub.user_id = p_user_id and ub.badge_id = v_badge.id;

    badge_id := v_badge.id;
    name := v_badge.name;
    description := v_badge.description;
    icon := v_badge.icon;
    color_scheme := v_badge.color_scheme;
    earned := v_earned_at is not null;
    earned_at := v_earned_at;
    progress := least(coalesce(v_current, 0), v_target);
    target := v_target;
    return next;
  end loop;
end;
$$ language plpgsql stable security definer;
