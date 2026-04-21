-- Triage prototype tables. Run once in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists triage_sessions (
  id uuid primary key default gen_random_uuid(),
  mode text not null,
  status text not null default 'bot',
  bucket text,
  urgency text,
  attempts int not null default 0,
  pledge_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists triage_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references triage_sessions(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

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
