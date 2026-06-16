-- Row Level Security hardening.
-- Run in the Supabase SQL editor. Idempotent (uses drop policy if exists).
--
-- What this does TODAY:
--   • leaderboards — RLS on, public SELECT, public INSERT (no UPDATE/DELETE).
--     The leaderboard table is meant to be readable + appendable by anyone
--     playing the games. Locking UPDATE/DELETE stops casual tampering.
--
-- What this DOES NOT do:
--   • The private tables (grid_*, budget_*, collection, grid_task_savings)
--     stay UNRESTRICTED. Enabling RLS on them without a server-route refactor
--     would break the Grid and Ledger UIs because they query Supabase directly
--     from the client using the anon key. Real hardening for those tables
--     requires either Supabase Auth + auth.uid() policies, OR refactoring all
--     reads/writes to go through server routes using SUPABASE_SERVICE_ROLE_KEY.
--     Until that happens, anyone who finds the anon URL can still read the
--     private data even with the UI password gates in place.

alter table leaderboards enable row level security;

drop policy if exists "leaderboards public read"   on leaderboards;
drop policy if exists "leaderboards public append" on leaderboards;

create policy "leaderboards public read"
  on leaderboards
  for select
  to anon, authenticated
  using (true);

create policy "leaderboards public append"
  on leaderboards
  for insert
  to anon, authenticated
  with check (
    -- Sanity checks: only allow shapes the game UIs actually submit.
    game in ('grid','tetris','learning')
    and char_length(player_initials) between 1 and 10
    and score >= 0
  );
