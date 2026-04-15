-- WordShare Database Schema
-- Supabase Migration: 001_initial_schema.sql

-- ============================================================
-- 1. Profiles (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text not null unique,
  avatar_color text default '#2D6A4F',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 2. Posts (vocabulary entries)
-- ============================================================
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  word text not null,
  meaning text not null,
  example text default '',
  episode text default '',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_posts_author on public.posts(author_id);
create index idx_posts_created on public.posts(created_at desc);

-- ============================================================
-- 3. Reactions
-- ============================================================
create table public.reactions (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null check (emoji in ('👍', '🔥', '💡', '❤️')),
  created_at timestamptz default now() not null,
  unique(post_id, user_id, emoji)
);

create index idx_reactions_post on public.reactions(post_id);

-- ============================================================
-- 4. Comments
-- ============================================================
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  text text not null,
  created_at timestamptz default now() not null
);

create index idx_comments_post on public.comments(post_id);
create index idx_comments_created on public.comments(created_at);

-- ============================================================
-- 5. SRS Cards (spaced repetition state, per user per post)
-- ============================================================
create table public.srs_cards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  ease_factor real default 2.5 not null,
  interval_days integer default 0 not null,
  repetitions integer default 0 not null,
  next_review timestamptz default now() not null,
  last_result text check (last_result in ('correct', 'incorrect', null)),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, post_id)
);

create index idx_srs_user on public.srs_cards(user_id);
create index idx_srs_next_review on public.srs_cards(user_id, next_review);

-- ============================================================
-- 6. Quiz History
-- ============================================================
create table public.quiz_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  mode text not null check (mode in ('en2jp', 'jp2en')),
  correct boolean not null,
  created_at timestamptz default now() not null
);

create index idx_quiz_user on public.quiz_history(user_id);
create index idx_quiz_created on public.quiz_history(user_id, created_at desc);

-- ============================================================
-- 7. Row Level Security (RLS)
-- ============================================================

-- Profiles: users can read all, update own
alter table public.profiles enable row level security;
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Posts: readable by all authenticated, writable by author
alter table public.posts enable row level security;
create policy "Posts are viewable by authenticated users"
  on public.posts for select
  to authenticated
  using (true);
create policy "Users can create posts"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = author_id);
create policy "Users can update own posts"
  on public.posts for update
  to authenticated
  using (auth.uid() = author_id);
create policy "Users can delete own posts"
  on public.posts for delete
  to authenticated
  using (auth.uid() = author_id);

-- Reactions: readable by all, writable by reactor
alter table public.reactions enable row level security;
create policy "Reactions are viewable by authenticated users"
  on public.reactions for select
  to authenticated
  using (true);
create policy "Users can add reactions"
  on public.reactions for insert
  to authenticated
  with check (auth.uid() = user_id);
create policy "Users can remove own reactions"
  on public.reactions for delete
  to authenticated
  using (auth.uid() = user_id);

-- Comments: readable by all, writable by author
alter table public.comments enable row level security;
create policy "Comments are viewable by authenticated users"
  on public.comments for select
  to authenticated
  using (true);
create policy "Users can create comments"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = author_id);
create policy "Users can delete own comments"
  on public.comments for delete
  to authenticated
  using (auth.uid() = author_id);

-- SRS Cards: private to each user
alter table public.srs_cards enable row level security;
create policy "Users can manage own SRS cards"
  on public.srs_cards for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Quiz History: private to each user
alter table public.quiz_history enable row level security;
create policy "Users can manage own quiz history"
  on public.quiz_history for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 8. Realtime subscriptions
-- ============================================================
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.reactions;
alter publication supabase_realtime add table public.comments;

-- ============================================================
-- 9. Useful views
-- ============================================================
create or replace view public.posts_with_counts as
select
  p.*,
  pr.username as author_name,
  pr.avatar_color as author_color,
  (select count(*) from public.comments c where c.post_id = p.id) as comment_count,
  (select count(*) from public.reactions r where r.post_id = p.id) as reaction_count
from public.posts p
join public.profiles pr on pr.id = p.author_id;

-- ============================================================
-- 10. Auto-create SRS cards for all users when a new post is created
-- ============================================================
create or replace function public.create_srs_cards_for_new_post()
returns trigger as $$
begin
  insert into public.srs_cards (user_id, post_id)
  select id, new.id from public.profiles
  on conflict (user_id, post_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_post_created
  after insert on public.posts
  for each row execute procedure public.create_srs_cards_for_new_post();
