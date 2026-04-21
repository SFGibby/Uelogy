-- Triage prototype tables. Run once in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists triage_sessions (
  id uuid primary key default gen_random_uuid(),
  mode text not null,
  status text not null default 'bot',
  bucket text,
  urgency text,
  categories text[] not null default '{}',
  attempts int not null default 0,
  pledge_confirmed boolean not null default false,
  resolved boolean not null default false,
  resolved_at timestamptz,
  rep_name text,
  summary text,
  helios_solved boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe to run on existing deployments (idempotent additions):
alter table triage_sessions add column if not exists categories text[] not null default '{}';
alter table triage_sessions add column if not exists resolved boolean not null default false;
alter table triage_sessions add column if not exists resolved_at timestamptz;
alter table triage_sessions add column if not exists rep_name text;
alter table triage_sessions add column if not exists summary text;
alter table triage_sessions add column if not exists helios_solved boolean;

create table if not exists triage_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references triage_sessions(id) on delete cascade,
  role text not null,
  content text not null,
  image_url text,
  created_at timestamptz not null default now()
);

alter table triage_messages add column if not exists image_url text;

create index if not exists triage_messages_session_idx on triage_messages(session_id, created_at);

alter table triage_sessions enable row level security;
alter table triage_messages enable row level security;

drop policy if exists "triage_sessions_anon_select" on triage_sessions;
create policy "triage_sessions_anon_select"
  on triage_sessions for select to anon using (true);

drop policy if exists "triage_messages_anon_select" on triage_messages;
create policy "triage_messages_anon_select"
  on triage_messages for select to anon using (true);

alter publication supabase_realtime add table triage_sessions;
alter publication supabase_realtime add table triage_messages;
