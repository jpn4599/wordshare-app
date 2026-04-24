-- v2.2 Phase 6: Semantic reactions (got_it / tough_one / useful)
-- Replaces emoji-based `reactions` UI with semantic types.
-- The old `reactions` table is kept for backward compatibility but no longer populated.

create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('got_it', 'tough_one', 'useful')),
  created_at timestamptz not null default now(),
  unique(post_id, user_id, type)
);

create index if not exists idx_post_reactions_post on public.post_reactions(post_id);
create index if not exists idx_post_reactions_user on public.post_reactions(user_id);
create index if not exists idx_post_reactions_type on public.post_reactions(type);

-- RLS
alter table public.post_reactions enable row level security;

create policy "post_reactions_select_all"
  on public.post_reactions for select
  to authenticated
  using (true);

create policy "post_reactions_insert_own"
  on public.post_reactions for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "post_reactions_delete_own"
  on public.post_reactions for delete
  to authenticated
  using (user_id = auth.uid());

-- Realtime feed
alter publication supabase_realtime add table public.post_reactions;

-- Ensure SRS card exists when a user marks a post as "got_it".
-- NOTE: srs_cards are already auto-created for every user on new post insert
--       (see migration 001_initial_schema.sql, create_srs_cards_for_new_post).
--       This trigger is a safety net in case the profile was created after the post.
create or replace function public.sync_got_it_to_srs()
returns trigger as $$
begin
  if new.type = 'got_it' then
    insert into public.srs_cards (user_id, post_id)
    values (new.user_id, new.post_id)
    on conflict (user_id, post_id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_sync_got_it on public.post_reactions;
create trigger trg_sync_got_it
  after insert on public.post_reactions
  for each row execute function public.sync_got_it_to_srs();
