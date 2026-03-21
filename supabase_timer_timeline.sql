-- Timer timeline cloud sync table
-- Run in Supabase SQL Editor

create table if not exists public.timer_timeline (
  key text primary key,
  value jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists timer_timeline_updated_at_idx
  on public.timer_timeline (updated_at);

alter table public.timer_timeline enable row level security;

-- Open policy for anon client (matches current app sync style)
drop policy if exists "anon_can_read_timer_timeline" on public.timer_timeline;
create policy "anon_can_read_timer_timeline"
  on public.timer_timeline
  for select
  to anon
  using (true);

drop policy if exists "anon_can_write_timer_timeline" on public.timer_timeline;
create policy "anon_can_write_timer_timeline"
  on public.timer_timeline
  for all
  to anon
  using (true)
  with check (true);
