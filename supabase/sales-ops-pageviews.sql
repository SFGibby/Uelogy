-- Pageview log for /sales-ops. Lets us trace a leaked screenshot back to
-- the viewer by matching the identity cookie's name against this table.
-- Rows are append-only; prune via a scheduled job once retention is set.

create extension if not exists "pgcrypto";

create table if not exists public.sales_ops_pageviews (
  id uuid primary key default gen_random_uuid(),
  name text,
  path text not null,
  ip text,
  user_agent text,
  viewed_at timestamptz not null default now()
);

create index if not exists sales_ops_pageviews_viewed_at_idx
  on public.sales_ops_pageviews (viewed_at desc);

create index if not exists sales_ops_pageviews_name_idx
  on public.sales_ops_pageviews (name, viewed_at desc);

-- RLS kept off; the service-role key writes directly from the server.
-- If/when we expose a read view to Sam's dashboard, add a policy here.
alter table public.sales_ops_pageviews disable row level security;
