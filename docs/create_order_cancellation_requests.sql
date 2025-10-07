-- Create a richer table to store customer cancellation requests
create table if not exists public.order_cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id text not null,
  user_name text,
  order_number text,
  reason text,
  image_urls jsonb, -- array of public URLs of uploaded images
  status text not null default 'submitted', -- submitted | acknowledged | rejected
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_order_cancel_req_order_id on public.order_cancellation_requests(order_id);
create index if not exists idx_order_cancel_req_user_id on public.order_cancellation_requests(user_id);
create index if not exists idx_order_cancel_req_status on public.order_cancellation_requests(status);
create index if not exists idx_order_cancel_req_order_number on public.order_cancellation_requests(order_number);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_updated_at_order_cancel_req on public.order_cancellation_requests;
create trigger trg_set_updated_at_order_cancel_req
before update on public.order_cancellation_requests
for each row execute function public.set_updated_at();

-- Optional RLS (enable and adjust per your auth model)
-- alter table public.order_cancellation_requests enable row level security;
-- create policy "Allow insert by anon" on public.order_cancellation_requests for insert to anon with check (true);
-- create policy "Allow select by anon" on public.order_cancellation_requests for select to anon using (true);

-- Safe migration: add user_name column if table already exists without it
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'order_cancellation_requests'
      and column_name = 'user_name'
  ) then
    alter table public.order_cancellation_requests add column user_name text;
  end if;
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'order_cancellation_requests'
      and column_name = 'order_number'
  ) then
    alter table public.order_cancellation_requests add column order_number text;
    create index if not exists idx_order_cancel_req_order_number on public.order_cancellation_requests(order_number);
  end if;
end $$;

