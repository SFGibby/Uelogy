-- Budget tool (Ledger cabinet) schema.
-- Run once in Supabase SQL editor. Idempotent.

-- Add a cost target to grid_tasks so a personal project doubles as a savings goal.
alter table grid_tasks
  add column if not exists cost numeric(10,2);

-- Two payers: Uel (Sam) and Antha. "Joint" is its own row so transactions can attribute fairly.
create table if not exists budget_payers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null,
  created_at timestamptz default now()
);

-- Categories drive the ledger taxonomy and color-code the entries.
-- kind: 'income' (positive cash flow), 'expense' (out), 'savings' (set-aside, not consumed), 'transfer' (between accounts).
create table if not exists budget_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null,
  kind text not null check (kind in ('income','expense','savings','transfer')),
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- Recurring rules: fixed monthly / annual bills. Used by the ledger to auto-project
-- the current month's commitments. Each rule has a next_due_date that bumps after
-- a transaction is marked as fulfilling it.
create table if not exists budget_recurring (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric(10,2) not null,
  payer_id uuid references budget_payers(id) on delete set null,
  category_id uuid references budget_categories(id) on delete set null,
  cadence text not null check (cadence in ('monthly','annual','biennial')),
  next_due_date date,
  remaining_debt numeric(12,2),
  remaining_payments int,
  is_active boolean not null default true,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Transactions: every line on the ledger.
-- grid_task_id (nullable) is the savings-goal link: a transaction tagged with kind='savings'
-- and a grid_task_id counts toward that personal project's cost target.
create table if not exists budget_transactions (
  id uuid primary key default gen_random_uuid(),
  occurred_on date not null,
  amount numeric(10,2) not null,
  payer_id uuid references budget_payers(id) on delete set null,
  category_id uuid references budget_categories(id) on delete set null,
  kind text not null check (kind in ('income','expense','savings','transfer')),
  description text not null,
  note text,
  grid_task_id uuid references grid_tasks(id) on delete set null,
  recurring_id uuid references budget_recurring(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists budget_transactions_occurred_idx on budget_transactions(occurred_on desc);
create index if not exists budget_transactions_category_idx on budget_transactions(category_id);
create index if not exists budget_transactions_payer_idx on budget_transactions(payer_id);
create index if not exists budget_transactions_grid_task_idx on budget_transactions(grid_task_id);

create index if not exists budget_recurring_active_idx on budget_recurring(is_active, next_due_date);

-- Bump updated_at on update for both tables.
create or replace function budget_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists budget_transactions_touch on budget_transactions;
create trigger budget_transactions_touch
  before update on budget_transactions
  for each row execute function budget_touch_updated_at();

drop trigger if exists budget_recurring_touch on budget_recurring;
create trigger budget_recurring_touch
  before update on budget_recurring
  for each row execute function budget_touch_updated_at();

-- View: per-task savings progress. Lets the Grid show "$saved / $cost" without
-- the client doing the aggregation.
create or replace view grid_task_savings as
select
  t.id as grid_task_id,
  t.cost,
  coalesce(sum(case when tx.kind = 'savings' then tx.amount else 0 end), 0) as saved
from grid_tasks t
left join budget_transactions tx on tx.grid_task_id = t.id
where t.cost is not null
group by t.id, t.cost;

-- Seed payers.
insert into budget_payers (name, color)
select * from (values
  ('Uel',   '#00f0ff'),
  ('Antha', '#ff7fb1'),
  ('Joint', '#ffd24a')
) as v(name, color)
where not exists (select 1 from budget_payers);

-- Seed categories. Pulled from Sam's sheet plus standard income/transfer slots.
-- Colors echo the Tron palette but stay readable on warm ledger paper.
insert into budget_categories (name, color, kind)
select * from (values
  -- Income
  ('Paycheck',         '#00ff7f', 'income'),
  ('RSU/ICUP',         '#3fd17a', 'income'),
  ('Gifts',            '#a8e6a3', 'income'),
  -- Fixed expenses
  ('Mortgage',         '#c84a4a', 'expense'),
  ('Boat',             '#b56a3a', 'expense'),
  ('Water Softener',   '#8aa6b8', 'expense'),
  ('Tithing',          '#d4af37', 'expense'),
  ('Utilities',        '#7a8fa0', 'expense'),
  ('Gas Utility',      '#5a8fa8', 'expense'),
  ('Car Insurance',    '#9a6a3a', 'expense'),
  ('Subscriptions',    '#a07ec7', 'expense'),
  -- Variable expenses
  ('Food',             '#ff7a4a', 'expense'),
  ('Eating Out',       '#ff9a6a', 'expense'),
  ('Groceries',        '#e07a30', 'expense'),
  ('Gas',              '#f0a000', 'expense'),
  ('Car',              '#b08040', 'expense'),
  ('Home',             '#a05a3a', 'expense'),
  ('Clothes',          '#c060a0', 'expense'),
  ('Health',           '#60b090', 'expense'),
  ('Gym',              '#60c0c0', 'expense'),
  ('Education',        '#a0a040', 'expense'),
  ('Birthday',         '#e060a0', 'expense'),
  ('Christmas',        '#c03030', 'expense'),
  ('Gift',             '#d080d0', 'expense'),
  ('Debt',             '#806040', 'expense'),
  ('Other',            '#888888', 'expense'),
  -- Savings buckets
  ('Savings',          '#00ff7f', 'savings'),
  ('Project Savings',  '#00d090', 'savings'),
  -- Transfers
  ('Transfer',         '#a0a0a0', 'transfer')
) as v(name, color, kind)
where not exists (select 1 from budget_categories);

-- Seed recurring rules from the sheet (current as of Jan 2026 statement).
-- next_due_date stays null where the sheet had "???" or no date; the UI will surface those for confirmation.
do $$
declare
  uel_id uuid;
  antha_id uuid;
  joint_id uuid;
begin
  select id into uel_id from budget_payers where name = 'Uel';
  select id into antha_id from budget_payers where name = 'Antha';
  select id into joint_id from budget_payers where name = 'Joint';

  if not exists (select 1 from budget_recurring) then
    insert into budget_recurring (name, amount, payer_id, category_id, cadence, next_due_date, remaining_debt, remaining_payments)
    select r.name, r.amount, r.payer_id, c.id, r.cadence, r.next_due_date, r.remaining_debt, r.remaining_payments
    from (values
      ('Mortgage',          2788.07, uel_id,   'Mortgage',       'monthly', date '2026-03-01', 381429.02, 137),
      ('Boat',               287.33, uel_id,   'Boat',           'monthly', date '2026-03-01',   2298.68,   8),
      ('Water Softener',      96.78, uel_id,   'Water Softener', 'monthly', date '2026-02-23',   4669.07,  47),
      ('Tithing (Uel)',      516.00, uel_id,   'Tithing',        'monthly', date '2026-02-06', null, null),
      ('Tithing (Antha)',    240.00, antha_id, 'Tithing',        'monthly', null,               null, null),
      ('Utilities',          252.00, antha_id, 'Utilities',      'monthly', date '2026-02-25',  null, null),
      ('Gas Utility',         51.00, uel_id,   'Gas Utility',    'monthly', date '2026-02-21',  null, null),
      ('Gas (budget)',       350.00, uel_id,   'Gas',            'monthly', null,               null, null),
      ('Savings (Antha)',    500.00, antha_id, 'Savings',        'monthly', null,               null, null),
      ('Eating Out',         250.00, joint_id, 'Eating Out',     'monthly', null,               null, null),
      ('Groceries',          500.00, joint_id, 'Groceries',      'monthly', null,               null, null),
      ('Replit',              26.84, uel_id,   'Subscriptions',  'monthly', date '2026-02-04',  null, null),
      ('Primerica Savings',   50.00, uel_id,   'Savings',        'monthly', date '2026-02-02',  null, null),
      ('Car Insurance',       81.55, antha_id, 'Car Insurance',  'monthly', null,               null, null),
      ('Apple One',           41.10, antha_id, 'Subscriptions',  'monthly', null,               null, null),
      ('Sirius XM',            3.18, antha_id, 'Subscriptions',  'monthly', null,               null, null),
      ('Canva',               16.23, antha_id, 'Subscriptions',  'monthly', null,               null, null),
      ('Car Renewal (Uel)',  165.50, uel_id,   'Car',            'annual',  date '2026-03-01',  null, null),
      ('ChatGPT',            216.60, antha_id, 'Subscriptions',  'annual',  date '2026-07-17',  null, null),
      ('Costco Membership',  139.43, uel_id,   'Subscriptions',  'annual',  date '2026-09-02',  null, null),
      ('Chase Card',          95.00, uel_id,   'Subscriptions',  'annual',  date '2026-11-01',  null, null),
      ('Rec Center',         435.17, antha_id, 'Subscriptions',  'annual',  date '2027-02-01',  null, null),
      ('Vocabulary',          12.00, antha_id, 'Subscriptions',  'annual',  null,               null, null),
      ('Car Renewal (Antha)',165.50, antha_id, 'Car',            'annual',  null,               null, null)
    ) as r(name, amount, payer_id, category_name, cadence, next_due_date, remaining_debt, remaining_payments)
    join budget_categories c on c.name = r.category_name;
  end if;
end $$;
