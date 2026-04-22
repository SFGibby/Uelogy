-- Brain Storm: department scope submissions + analysis reports.
-- Internal tool, lives under /triage/brainstorm. Run once in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists brainstorm_submissions (
  id uuid primary key default gen_random_uuid(),
  department text not null,
  parent_company text,
  head_name text,
  head_role text,
  purpose text not null,
  owns text not null,
  does_not_own text,
  top_questions text not null,
  systems text[] not null default '{}',
  handoff_partners text,
  gray_areas text,
  contact_sla text,
  submitted_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists brainstorm_submissions_dept_idx
  on brainstorm_submissions(department, created_at desc);

create table if not exists brainstorm_reports (
  id uuid primary key default gen_random_uuid(),
  submission_count int not null,
  overlaps_markdown text not null,
  gaps_markdown text not null,
  recommendations_markdown text not null,
  raw_model_output text,
  created_at timestamptz not null default now()
);

alter table brainstorm_submissions enable row level security;
alter table brainstorm_reports enable row level security;

-- Admin-only. The anon key never reads or writes these tables; all access is
-- via the service-role key from server-side routes.
drop policy if exists "brainstorm_submissions_no_anon" on brainstorm_submissions;
drop policy if exists "brainstorm_reports_no_anon" on brainstorm_reports;
