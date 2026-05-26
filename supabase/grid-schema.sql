-- The Grid — project tracker schema
-- Run once in Supabase SQL editor. Idempotent (uses IF NOT EXISTS).

-- Stages: kanban columns. Configurable name + color + order.
create table if not exists grid_stages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null,        -- hex string, e.g. '#00f0ff'
  position int not null,      -- column order, smaller = left
  created_at timestamptz default now()
);

-- Types: tag taxonomy. Used to color-code tasks regardless of stage.
create table if not exists grid_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null,
  created_at timestamptz default now()
);

-- Tasks: cards on the board. One stage, one type, ordered within stage.
create table if not exists grid_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  stage_id uuid references grid_stages(id) on delete set null,
  type_id uuid references grid_types(id) on delete set null,
  position int not null default 0,             -- order within stage
  due_at date,
  links jsonb not null default '[]'::jsonb,    -- [{label, url}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists grid_tasks_stage_idx on grid_tasks(stage_id);
create index if not exists grid_tasks_type_idx on grid_tasks(type_id);
create index if not exists grid_tasks_position_idx on grid_tasks(stage_id, position);

-- Trigger to bump updated_at on any update.
create or replace function grid_tasks_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists grid_tasks_touch on grid_tasks;
create trigger grid_tasks_touch
  before update on grid_tasks
  for each row execute function grid_tasks_touch_updated_at();

-- Seed default stages if none exist yet.
insert into grid_stages (name, color, position)
select * from (values
  ('Backlog',     '#5a6a7a', 1),
  ('In Progress', '#00f0ff', 2),
  ('Review',      '#f0a000', 3),
  ('Done',        '#00ff7f', 4)
) as v(name, color, position)
where not exists (select 1 from grid_stages);

-- Seed default types if none exist yet.
insert into grid_types (name, color)
select * from (values
  ('Personal Site', '#ff00ff'),
  ('Ride SU',       '#00ff7f'),
  ('Career',        '#f0a000'),
  ('SunPower',      '#00f0ff'),
  ('Learning',      '#ffe000')
) as v(name, color)
where not exists (select 1 from grid_types);
