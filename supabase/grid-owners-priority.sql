-- Grid: owner-model + priority + 3-stage refactor (2026-08-19)
-- Idempotent. Run once in Supabase SQL editor.

-- Priority: 0 = Critical, 1 = High, 2 = Mid, 3 = Low
alter table grid_tasks
  add column if not exists priority int not null default 3
  check (priority between 0 and 3);

-- Wipe existing data — board was empty anyway
delete from grid_tasks;
delete from grid_stages;
delete from grid_types;

-- New stage set: Proactive / Active / Reactive
insert into grid_stages (name, color, position) values
  ('Proactive', '#00ff7f', 1),
  ('Active',    '#00f0ff', 2),
  ('Reactive',  '#ff2040', 3);
