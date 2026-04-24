-- v2.2 Phase 9: Featured word of the day (app-wide, no groups in WordShare)

create table if not exists public.featured_words (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  feature_date date not null unique,
  got_it_count int not null default 0,
  useful_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_featured_words_date
  on public.featured_words(feature_date desc);

alter table public.featured_words enable row level security;

drop policy if exists "featured_select_all" on public.featured_words;
create policy "featured_select_all"
  on public.featured_words for select to authenticated using (true);

-- Pick yesterday's top-got_it post (app-wide). Not re-featured within 7 days.
create or replace function public.select_featured_word()
returns uuid as $$
declare
  v_post_id uuid;
  v_today date := (now() at time zone 'Asia/Tokyo')::date;
  v_yesterday date := v_today - interval '1 day';
  v_seven_days_ago date := v_today - interval '7 days';
  v_got_it_count int;
  v_useful_count int;
begin
  select p.id,
         count(r.id) filter (where r.type = 'got_it')::int,
         count(r.id) filter (where r.type = 'useful')::int
    into v_post_id, v_got_it_count, v_useful_count
  from public.posts p
  left join public.post_reactions r
    on p.id = r.post_id
   and (r.created_at at time zone 'Asia/Tokyo')::date = v_yesterday
  where not exists (
    select 1 from public.featured_words fw
    where fw.post_id = p.id
      and fw.feature_date > v_seven_days_ago
  )
  group by p.id
  having count(r.id) filter (where r.type = 'got_it') > 0
  order by count(r.id) filter (where r.type = 'got_it') desc,
           count(r.id) filter (where r.type = 'useful') desc,
           random()
  limit 1;

  if v_post_id is not null then
    insert into public.featured_words (post_id, feature_date, got_it_count, useful_count)
    values (v_post_id, v_today, v_got_it_count, v_useful_count)
    on conflict (feature_date) do nothing;
  end if;

  return v_post_id;
end;
$$ language plpgsql security definer;
