-- Run this in your Supabase SQL editor (supabase.com → SQL Editor)

-- Rooms table
create table if not exists rooms (
  id text primary key,
  created_at timestamp with time zone default now(),
  title text default 'Live Session',
  is_active boolean default true,
  summary text,
  full_transcript text
);

-- Transcript chunks table (each word/phrase that comes in live)
create table if not exists transcript_chunks (
  id uuid primary key default gen_random_uuid(),
  room_id text references rooms(id) on delete cascade,
  text text not null,
  speaker text default 'Speaker',
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security but allow public access for simplicity
alter table rooms enable row level security;
alter table transcript_chunks enable row level security;

create policy "Public read rooms" on rooms for select using (true);
create policy "Public insert rooms" on rooms for insert with check (true);
create policy "Public update rooms" on rooms for update using (true);

create policy "Public read chunks" on transcript_chunks for select using (true);
create policy "Public insert chunks" on transcript_chunks for insert with check (true);

-- Enable Realtime on transcript_chunks (THIS IS THE KEY PART)
alter publication supabase_realtime add table transcript_chunks;
alter publication supabase_realtime add table rooms;
