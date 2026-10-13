-- Solace Cyber Workstations shared community storage
-- Run this in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.community_entries (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('comment','post','review')),
  name text not null check (char_length(name) between 1 and 80),
  title text,
  content text not null check (char_length(content) between 2 and 5000),
  article text,
  rating integer check (rating between 1 and 5),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create index if not exists community_entries_public_list
  on public.community_entries (status, type, created_at desc);
alter table public.community_entries enable row level security;

drop policy if exists "Anyone can read approved community entries" on public.community_entries;
create policy "Anyone can read approved community entries"
  on public.community_entries for select to anon, authenticated
  using (status = 'approved');

drop policy if exists "Visitors can submit community entries for review" on public.community_entries;
create policy "Visitors can submit community entries for review"
  on public.community_entries for insert to anon, authenticated
  with check (
    status = 'pending'
    and char_length(trim(name)) between 1 and 80
    and char_length(trim(content)) between 2 and 5000
    and type in ('comment','post','review')
    and (type <> 'review' or rating between 1 and 5)
  );

-- Submissions are intentionally pending until you review and approve them
-- in Supabase Table Editor. Do not expose a service_role key on the website.
