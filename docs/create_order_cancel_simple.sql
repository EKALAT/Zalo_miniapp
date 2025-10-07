-- Simple cancellation table for immediate use
-- Columns: id, user_id, user_name, order_number, reason, created_at

create table if not exists public.order_cancel_simple (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_name text,
  order_number text not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_cancel_simple_user_id on public.order_cancel_simple(user_id);
create index if not exists idx_order_cancel_simple_order_number on public.order_cancel_simple(order_number);

-- Easiest way to allow client inserts right away
alter table public.order_cancel_simple disable row level security;


