-- Screenshot-proxy signal log for /sales-ops. Nothing exposed to the viewer.
-- Each row = one best-effort "someone probably grabbed a screenshot" event
-- fired by components/sales-ops/ScreenshotSignals.tsx. Signal types carry
-- different confidence levels; filter in queries.

create extension if not exists "pgcrypto";

create table if not exists public.sales_ops_screenshot_signals (
  id uuid primary key default gen_random_uuid(),
  name text,
  path text not null,
  signal_type text not null,
  meta text,
  ip text,
  user_agent text,
  detected_at timestamptz not null default now()
);

create index if not exists sales_ops_screenshot_signals_detected_at_idx
  on public.sales_ops_screenshot_signals (detected_at desc);

create index if not exists sales_ops_screenshot_signals_name_idx
  on public.sales_ops_screenshot_signals (name, detected_at desc);

create index if not exists sales_ops_screenshot_signals_type_idx
  on public.sales_ops_screenshot_signals (signal_type, detected_at desc);

alter table public.sales_ops_screenshot_signals disable row level security;
