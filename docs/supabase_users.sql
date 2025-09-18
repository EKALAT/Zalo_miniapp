-- Create users table to store Zalo Mini App user info
create table if not exists public.users (
  id text primary key,            -- zalo user id (zmp-sdk userInfo.id)
  name text,
  avatar text,
  phone text,
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.users enable row level security;

-- Development policy: allow inserts/updates from anon key
-- WARNING: This is for development only. Restrict in production.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'users' and policyname = 'dev allow upsert'
  ) then
    create policy "dev allow upsert"
    on public.users
    for all
    to anon
    using (true)
    with check (true);
  end if;
end $$;

-- Optional index to speed up lookups by phone
create index if not exists users_phone_idx on public.users (phone);


