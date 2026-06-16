-- Leaderboards — shared scoreboard for the arcade's scorable cabinets.
-- Run once in the Supabase SQL editor. Idempotent.
-- No seed rows: scores start accumulating from the first time someone plays.

create table if not exists leaderboards (
  id uuid primary key default gen_random_uuid(),
  game text not null check (game in ('grid','tetris','learning')),
  player_initials text not null,
  score int not null,
  is_sam boolean not null default false,
  played_at timestamptz not null default now()
);

create index if not exists leaderboards_game_score_idx
  on leaderboards(game, score desc);
