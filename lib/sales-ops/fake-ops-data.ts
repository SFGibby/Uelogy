// Deterministic fake ops data for the Sales Ops beta.
// Seeded by YYYY-MM-DD so refreshes within a day are stable.
// Scope expanded 2026-10-28 for Kapil review: Sales Experience + ALL ops SLAs + top performers
// across booking, pull-through, recruiting, onboarding, deactivations.

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function daySeed(d = new Date()): number {
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type Teams = { region: string; teams: string[] }[];

const ROSTER: Teams = [
  {
    region: 'Blue Raven',
    teams: ['The Sunny D (MI)', 'Shockwave (Wilmington)', 'Raleighwood (NC)', 'AbsoluT (CO)'],
  },
  {
    region: 'Movement',
    teams: ['EXODUS (NV/OR)', 'X Pros', 'Philly', 'Bend (OR)', 'Summit (OR)', 'RTL (OR)'],
  },
  { region: 'Solar\u2019s Dead', teams: ['CTRL', 'AEROTYNE'] },
  { region: 'Precision', teams: ['Gldn'] },
];

const REP_NAMES = [
  'Jules Lyusya', 'Jay Farrell', 'Blayne Meyer', 'Nate Battles', 'Julian Maytorena',
  'Jordan Roberts', 'Tarrie French', 'Cage Matthews', 'Adam Larue', 'Justin Clayton',
  'Nicolas Knight', 'Omar Soliman', 'Omar Ahmed', 'Kellen Rose', 'Caleb Bacon',
  'Izz Issa', 'Lukas Yagi', 'Megan Thomason', 'Kyle Thomson', 'Michael Barrett',
  'Timothy Chung', 'James Arthur', 'Trent Dawson', 'Marco Vellis', 'Hunter Zeaman',
  'Daniel Parsons', 'Teak Barbour', 'Preston Vale', 'Carter Hall', 'Noah Shin',
];

export type SlaStatus = 'on-pace' | 'watch' | 'behind';

export interface Kpis {
  bookingsMtd: number;
  bookingsDeltaPct: number;
  installsMtd: number;
  installsDeltaPct: number;
  pipelineUsd: number;
  cycleDays: number;
  pullThroughPct: number;
  pullThroughDeltaPct: number;
}

export interface SlaCard {
  department: string;      // 'Site Survey' | 'Design' | 'Credit & Finance' | 'Funding' | ...
  label: string;           // human label of the SLA step
  value: string;           // '5d median'
  targetLabel: string;     // 'Target 7d'
  status: SlaStatus;
}

export interface PacingRow {
  region: string;
  team: string;
  targetMtd: number;
  actualMtd: number;
  pct: number;
  trend4w: number[];
}

export interface RepRow {
  name: string;
  team: string;
  region: string;
  value: number;        // metric value
  valueLabel: string;   // formatted
}

export interface Leaderboard {
  title: string;
  subtitle: string;
  metricLabel: string;   // e.g. 'Bookings MTD'
  rows: RepRow[];
}

export interface ChannelHealth {
  label: string;
  value: string;
  delta: string;
  tone: 'good' | 'watch' | 'behind' | 'neutral';
}

export interface OpsSnapshot {
  asOf: string;
  kpis: Kpis;
  sla: SlaCard[];
  pacing: PacingRow[];
  leaderboards: Leaderboard[];
  channel: ChannelHealth[];
}

export interface FunnelStage {
  label: string;        // "Contract \u2192 Credit"
  rate: number;         // pass-through rate 0-100
  droppedCount: number; // how many fell out at this step
  medianDays: number;
}

export type RepStatus = 'hot' | 'steady' | 'cooling' | 'flight-risk';

export interface RepCard {
  name: string;
  team: string;
  bookingsMtd: number;
  pullThroughPct: number;
  status: RepStatus;
  reason: string;       // "Up 40% WoW" or "Zero bookings in 10 days"
}

export interface StuckDeal {
  customer: string;
  rep: string;
  team: string;
  stage: string;        // "Permits" | "Credit & Finance" | ...
  daysStuck: number;
  owner: string;        // ops person to ping
  ownerRole: string;
}

export interface CallListItem {
  tone: 'congratulate' | 'coach' | 'intervene';
  who: string;          // rep or team name
  context: string;      // "Blue Raven \u00b7 Raleighwood (NC)"
  why: string;          // "At 70% to plan with 3 days left"
  action: string;       // "15-min ride-along today"
}

export type Cadence = 'day' | 'week' | 'month' | 'qtr';

export interface ScorecardRow {
  rep: string;
  team: string;
  knocks: number;
  sits: number;
  closes: number;
  leadToConversion: number;   // percent
  pullThrough: number;        // percent
  installs: number;           // count
  recruited: number;          // reps they brought on in period
  retention: number;          // retention percent for their reports
  overall: number;            // 0-100 equal-weighted
}

export interface RegionalSnapshot {
  asOf: string;
  region: string;
  teamCount: number;
  repCount: number;
  bookingsMtd: number;
  bookingsTargetMtd: number;
  pacingPct: number;
  installsMtd: number;
  pullThroughPct: number;
  pullThroughDeltaPct: number;
  cycleDays: number;
  funnel: FunnelStage[];
  callList: CallListItem[];
  teamRows: PacingRow[];
  reps: RepCard[];
  stuckDeals: StuckDeal[];
  sla: SlaCard[];           // SLAs still shown but filtered-feel
  channel: ChannelHealth[]; // Sales experience for this region
}

function jitter(rand: () => number, base: number, pct: number): number {
  const delta = base * pct * (rand() * 2 - 1);
  return base + delta;
}

function statusFromRoll(roll: number): SlaStatus {
  if (roll < 0.55) return 'on-pace';
  if (roll < 0.82) return 'watch';
  return 'behind';
}

export function buildSnapshot(now: Date = new Date()): OpsSnapshot {
  const rand = mulberry32(daySeed(now));

  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthProgress = dayOfMonth / daysInMonth;

  const QUARTERLY_BOOKINGS = 1029;
  const MONTHLY_BOOKINGS = QUARTERLY_BOOKINGS / 3;
  const MONTHLY_INSTALLS = 3293 / 12;

  const bookingsMtd = Math.round(jitter(rand, MONTHLY_BOOKINGS * monthProgress, 0.08));
  const installsMtd = Math.round(jitter(rand, MONTHLY_INSTALLS * monthProgress, 0.08));
  const cycleDays = Math.round(jitter(rand, 74, 0.06));
  const pipelineUsd = Math.round(jitter(rand, bookingsMtd * 4 * 45000, 0.1));
  const pullThroughPct = Math.round(jitter(rand, 88, 0.03));

  const kpis: Kpis = {
    bookingsMtd,
    bookingsDeltaPct: Math.round(jitter(rand, 6, 1.5)),
    installsMtd,
    installsDeltaPct: Math.round(jitter(rand, 4, 1.6)),
    pipelineUsd,
    cycleDays,
    pullThroughPct,
    pullThroughDeltaPct: Math.round(jitter(rand, 2, 1.5)),
  };

  // Expanded SLA set — one per step across every ops department Direct Ops owns.
  const slaDefs: Array<{ dept: string; label: string; baseDays: number; target: number }> = [
    { dept: 'Site Survey', label: 'Contract \u2192 Survey complete', baseDays: 5, target: 7 },
    { dept: 'Design',      label: 'Survey \u2192 Design complete', baseDays: 4, target: 5 },
    { dept: 'Credit & Finance', label: 'Contract \u2192 Credit approved', baseDays: 3, target: 4 },
    { dept: 'Funding', label: 'NTP \u2192 Milestone funded', baseDays: 11, target: 10 },
    { dept: 'Permits', label: 'Design \u2192 Permit submitted', baseDays: 6, target: 7 },
    { dept: 'Permits', label: 'Submitted \u2192 Approved', baseDays: 18, target: 21 },
    { dept: 'NTP', label: 'Permit approved \u2192 NTP', baseDays: 4, target: 5 },
    { dept: 'Install', label: 'NTP \u2192 Install start', baseDays: 14, target: 14 },
    { dept: 'Install', label: 'Install start \u2192 Substantial complete', baseDays: 3, target: 4 },
    { dept: 'Interconnection', label: 'Install complete \u2192 PTO', baseDays: 32, target: 30 },
    { dept: 'Change Orders', label: 'CO opened \u2192 CO closed', baseDays: 6, target: 7 },
    { dept: 'Escalations', label: 'Open escalations', baseDays: 14, target: 20 },
  ];

  const sla: SlaCard[] = slaDefs.map(d => {
    const roll = rand();
    const status = statusFromRoll(roll);
    const value = Math.round(jitter(rand, d.baseDays, 0.15));
    const isCount = d.dept === 'Escalations';
    return {
      department: d.dept,
      label: d.label,
      value: isCount ? `${value} open` : `${value}d median`,
      targetLabel: isCount ? `Target < ${d.target}` : `Target ${d.target}d`,
      status,
    };
  });

  const pacing: PacingRow[] = [];
  for (const r of ROSTER) {
    for (const t of r.teams) {
      const targetMtd = Math.round(40 + rand() * 180);
      const actualMtd = Math.round(targetMtd * jitter(rand, 0.92, 0.3));
      const pct = Math.round((actualMtd / targetMtd) * 100);
      const trend4w = Array.from({ length: 4 }, () => Math.round(targetMtd * (0.75 + rand() * 0.5)));
      pacing.push({ region: r.region, team: t, targetMtd, actualMtd, pct, trend4w });
    }
  }

  const allTeams = pacing.map(p => ({ region: p.region, team: p.team }));

  function randomRepRows(count: number, shape: 'bookings' | 'pullthrough' | 'count' | 'pct'): RepRow[] {
    const rows: RepRow[] = [];
    const shuffled = [...REP_NAMES].sort(() => rand() - 0.5).slice(0, count);
    for (const name of shuffled) {
      const t = allTeams[Math.floor(rand() * allTeams.length)];
      let value: number;
      let valueLabel: string;
      switch (shape) {
        case 'bookings':
          value = Math.round(16 + rand() * 24);
          valueLabel = `${value} bookings`;
          break;
        case 'pullthrough':
          value = Math.round(jitter(rand, 95, 0.03));
          valueLabel = `${value}% pull-through`;
          break;
        case 'count':
          value = Math.round(2 + rand() * 10);
          valueLabel = `${value} reps`;
          break;
        case 'pct':
          value = Math.round(jitter(rand, 85, 0.08));
          valueLabel = `${value}%`;
          break;
      }
      rows.push({ name, team: t.team, region: t.region, value, valueLabel });
    }
    return rows.sort((a, b) => b.value - a.value);
  }

  function teamRowsFromPacing(sortBy: (p: PacingRow) => number, metric: (p: PacingRow) => string, count = 5): RepRow[] {
    return [...pacing].sort((a, b) => sortBy(b) - sortBy(a)).slice(0, count).map(p => ({
      name: p.team,
      team: p.team,
      region: p.region,
      value: sortBy(p),
      valueLabel: metric(p),
    }));
  }

  const leaderboards: Leaderboard[] = [
    {
      title: 'Top reps by bookings',
      subtitle: 'Highest bookings written this month.',
      metricLabel: 'Bookings MTD',
      rows: randomRepRows(5, 'bookings'),
    },
    {
      title: 'Top reps by pull-through',
      subtitle: 'Signed deals that reach install.',
      metricLabel: 'Pull-through',
      rows: randomRepRows(5, 'pullthrough'),
    },
    {
      title: 'Top teams by bookings',
      subtitle: 'Teams leading the month.',
      metricLabel: 'Bookings MTD',
      rows: teamRowsFromPacing(p => p.actualMtd, p => `${p.actualMtd} bookings`),
    },
    {
      title: 'Top teams by pacing',
      subtitle: 'Highest % to monthly plan.',
      metricLabel: 'Pacing',
      rows: teamRowsFromPacing(p => p.pct, p => `${p.pct}% of plan`),
    },
  ];

  const inOnboarding = Math.round(14 + rand() * 10);
  const recruitingPipe = Math.round(28 + rand() * 20);
  const deactivatedQtd = Math.round(6 + rand() * 8);
  const avgOnboardDays = Math.round(jitter(rand, 11, 0.2));

  const channel: ChannelHealth[] = [
    {
      label: 'Pull-through',
      value: `${pullThroughPct}%`,
      delta: `${kpis.pullThroughDeltaPct >= 0 ? '+' : ''}${kpis.pullThroughDeltaPct}% MoM`,
      tone: pullThroughPct >= 90 ? 'good' : pullThroughPct >= 85 ? 'watch' : 'behind',
    },
    {
      label: 'Recruiting pipe',
      value: `${recruitingPipe} reps`,
      delta: 'in interview or offer',
      tone: 'neutral',
    },
    {
      label: 'Onboarding now',
      value: `${inOnboarding} reps`,
      delta: `~${avgOnboardDays}d avg to live`,
      tone: 'neutral',
    },
    {
      label: 'Deactivations QTD',
      value: `${deactivatedQtd} reps`,
      delta: deactivatedQtd > 10 ? 'elevated' : 'in range',
      tone: deactivatedQtd > 10 ? 'behind' : 'good',
    },
  ];

  return {
    asOf: now.toISOString().slice(0, 10),
    kpis,
    sla,
    pacing,
    leaderboards,
    channel,
  };
}

export const REGIONS = ROSTER.map(r => r.region);
export const TEAMS_BY_REGION: Record<string, string[]> = Object.fromEntries(ROSTER.map(r => [r.region, r.teams]));
export const ALL_TEAMS: string[] = ROSTER.flatMap(r => r.teams);

export type Scope = 'company' | 'region' | 'team';

export interface ScopeRow {
  key: string;         // stable id (region name, team name, or rep name)
  kind: 'region' | 'team' | 'rep';
  label: string;
  context: string;     // '4 teams \u00b7 24 reps' / 'Movement \u00b7 6 reps' / 'Blue Raven \u00b7 Shockwave'
  region?: string;
  team?: string;
  knocks: number;
  sits: number;
  closes: number;
  leadToConversion: number;
  pullThrough: number;
  installs: number;
  recruited: number;
  retention: number;
  overall: number;
}

function aggregateRows(rows: ScopeRow[]): Omit<ScopeRow, 'key' | 'kind' | 'label' | 'context' | 'region' | 'team'> {
  if (rows.length === 0) {
    return { knocks: 0, sits: 0, closes: 0, leadToConversion: 0, pullThrough: 0, installs: 0, recruited: 0, retention: 0, overall: 0 };
  }
  const sum = (f: (r: ScopeRow) => number) => rows.reduce((s, r) => s + f(r), 0);
  const avg = (f: (r: ScopeRow) => number) => Math.round(sum(f) / rows.length);
  return {
    knocks: sum(r => r.knocks),
    sits: sum(r => r.sits),
    closes: sum(r => r.closes),
    leadToConversion: avg(r => r.leadToConversion),
    pullThrough: avg(r => r.pullThrough),
    installs: sum(r => r.installs),
    recruited: sum(r => r.recruited),
    retention: avg(r => r.retention),
    overall: avg(r => r.overall),
  };
}

export function buildScopeRows(
  cadence: Cadence,
  scope: Scope,
  regionFilter: string | null,
  teamFilter: string | null,
  now: Date = new Date(),
): ScopeRow[] {
  // Always start from a full roster of rep rows. Each rep is tagged with
  // their region/team so we can roll up or filter however we want.
  const all = buildAllRepRows(cadence, now);

  if (scope === 'team') {
    const filtered = all.filter(r =>
      (regionFilter == null || r.region === regionFilter) &&
      (teamFilter == null || r.team === teamFilter),
    );
    return [...filtered].sort((a, b) => b.overall - a.overall);
  }

  if (scope === 'region') {
    const region = regionFilter;
    if (!region) return [];
    const teams = TEAMS_BY_REGION[region] ?? [];
    return teams.map(team => {
      const inTeam = all.filter(r => r.region === region && r.team === team);
      const agg = aggregateRows(inTeam);
      return {
        key: team,
        kind: 'team' as const,
        label: team,
        context: `${region} \u00b7 ${inTeam.length} ${inTeam.length === 1 ? 'rep' : 'reps'}`,
        region,
        team,
        ...agg,
      };
    }).sort((a, b) => b.overall - a.overall);
  }

  // Company
  return REGIONS.map(region => {
    const teams = TEAMS_BY_REGION[region] ?? [];
    const inRegion = all.filter(r => r.region === region);
    const agg = aggregateRows(inRegion);
    return {
      key: region,
      kind: 'region' as const,
      label: region,
      context: `${teams.length} ${teams.length === 1 ? 'team' : 'teams'} \u00b7 ${inRegion.length} reps`,
      region,
      ...agg,
    };
  }).sort((a, b) => b.overall - a.overall);
}

export function buildCompanyAggregate(cadence: Cadence, now: Date = new Date()): ScopeRow {
  const all = buildAllRepRows(cadence, now);
  const agg = aggregateRows(all);
  return {
    key: 'company',
    kind: 'region',
    label: 'Company',
    context: `${REGIONS.length} regions \u00b7 ${all.length} reps`,
    ...agg,
  };
}

// --- rep-level detail (deals / activity) --------------------------------

export interface RepDeal {
  id: string;
  customer: string;
  city: string;
  signedOn: string;      // ISO date
  stage: string;         // 'Signed' | 'Credit approved' | 'Install scheduled' | 'Installed' | 'PTO' | 'Cancelled'
  valueUsd: number;      // contract value
  pullThrough: 'live' | 'at-risk' | 'cancelled' | 'installed';
  daysInStage: number;
}

export interface RepDealsPayload {
  rep: string;
  team: string;
  region: string;
  signedCount: number;
  installedCount: number;
  pullThroughPct: number;
  avgDaysToInstall: number;
  deals: RepDeal[];
}

const CUSTOMERS = [
  'Thompson, L.', 'Hernandez, M.', 'Rowe, D.', 'Perkins, J.', 'Blount, R.',
  'Costa, A.', 'Fuentes, I.', 'Kim, S.', 'Nguyen, T.', 'Osei, K.',
  'Reyes, V.', 'Patel, N.', 'Walsh, B.', 'Jacobs, M.', 'Ruiz, E.',
  'Flannery, G.', 'Oyelowo, A.', 'Dvorak, P.', 'Castellanos, S.', 'Barros, J.',
];
const CITIES_BY_REGION: Record<string, string[]> = {
  'Blue Raven': ['Grand Rapids, MI', 'Charlotte, NC', 'Wilmington, NC', 'Denver, CO', 'Raleigh, NC'],
  'Movement':   ['Reno, NV', 'Bend, OR', 'Portland, OR', 'Salem, OR', 'Philadelphia, PA'],
  'Solar\u2019s Dead': ['Phoenix, AZ', 'Tucson, AZ'],
  'Precision':  ['San Antonio, TX', 'Austin, TX'],
};
const STAGE_PROGRESSION: Array<{ stage: string; pt: RepDeal['pullThrough']; targetDays: number }> = [
  { stage: 'Signed',             pt: 'live',       targetDays: 3 },
  { stage: 'Credit approved',    pt: 'live',       targetDays: 4 },
  { stage: 'Site survey done',   pt: 'live',       targetDays: 6 },
  { stage: 'Design in review',   pt: 'live',       targetDays: 5 },
  { stage: 'Permit submitted',   pt: 'live',       targetDays: 6 },
  { stage: 'NTP',                pt: 'live',       targetDays: 4 },
  { stage: 'Install scheduled',  pt: 'live',       targetDays: 10 },
  { stage: 'Installed',          pt: 'installed',  targetDays: 2 },
  { stage: 'PTO',                pt: 'installed',  targetDays: 32 },
];

export function buildRepDeals(repName: string, cadence: Cadence, now: Date = new Date()): RepDealsPayload {
  // Keyed by rep name so numbers are stable across reloads.
  const seed = daySeed(now) ^ Math.imul(hashString(repName), 16777619) ^ cadence.length;
  const rand = mulberry32(seed);

  // Resolve region / team by sampling the roster deterministically for this rep.
  const regionIdx = Math.floor(rand() * REGIONS.length);
  const region = REGIONS[regionIdx];
  const teams = TEAMS_BY_REGION[region];
  const team = teams[Math.floor(rand() * teams.length)];
  const cities = CITIES_BY_REGION[region] ?? ['\u2014'];

  const countBase = cadence === 'day' ? 1 : cadence === 'week' ? 4 : cadence === 'month' ? 18 : 48;
  const signedCount = Math.max(1, Math.round(countBase * (0.75 + rand() * 0.5)));
  const deals: RepDeal[] = [];
  const msPerDay = 86400000;

  for (let i = 0; i < signedCount; i++) {
    const stageIdx = Math.min(STAGE_PROGRESSION.length - 1, Math.floor(rand() * STAGE_PROGRESSION.length));
    // Older deals have progressed further on average; newer deals cluster earlier.
    const ageDays = Math.round(rand() * (cadence === 'day' ? 1 : cadence === 'week' ? 7 : cadence === 'month' ? 30 : 90));
    const signedOn = new Date(now.getTime() - ageDays * msPerDay).toISOString().slice(0, 10);
    const def = STAGE_PROGRESSION[Math.min(STAGE_PROGRESSION.length - 1, Math.max(0, stageIdx - Math.floor(rand() * 2)))];
    const atRiskRoll = rand();
    const cancelledRoll = rand();
    let pt: RepDeal['pullThrough'] = def.pt;
    let stage = def.stage;
    if (cancelledRoll < 0.06) { pt = 'cancelled'; stage = 'Cancelled'; }
    else if (atRiskRoll < 0.15 && def.pt === 'live') pt = 'at-risk';
    const valueUsd = Math.round(28000 + rand() * 36000);
    const daysInStage = Math.max(0, Math.round(jitter(rand, def.targetDays, 0.6)));
    deals.push({
      id: `D-${(seed % 10000).toString().padStart(4, '0')}-${i.toString().padStart(2, '0')}`,
      customer: CUSTOMERS[(i + Math.floor(rand() * CUSTOMERS.length)) % CUSTOMERS.length],
      city: cities[Math.floor(rand() * cities.length)],
      signedOn,
      stage,
      valueUsd,
      pullThrough: pt,
      daysInStage,
    });
  }

  deals.sort((a, b) => (a.signedOn < b.signedOn ? 1 : -1));

  const installed = deals.filter(d => d.pullThrough === 'installed');
  const live = deals.filter(d => d.pullThrough === 'live' || d.pullThrough === 'at-risk');
  const pullThroughBase = installed.length / Math.max(1, installed.length + deals.filter(d => d.pullThrough === 'cancelled').length);
  const pullThroughPct = Math.round((pullThroughBase || 0.88) * 100);
  const avgDaysToInstall = Math.round(STAGE_PROGRESSION.slice(0, 7).reduce((s, p) => s + p.targetDays, 0) * (0.9 + rand() * 0.3));

  return {
    rep: repName,
    team,
    region,
    signedCount: deals.length,
    installedCount: installed.length,
    pullThroughPct,
    avgDaysToInstall,
    deals,
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Internal helper: full roster of rep rows regardless of filter, assigned
// deterministically to a region/team so rollups stay consistent.
function buildAllRepRows(cadence: Cadence, now: Date): ScopeRow[] {
  const rand = mulberry32(daySeed(now) ^ cadence.length);
  // Build a stable rep -> (region, team) mapping per day.
  const assignments: Array<{ rep: string; region: string; team: string }> = [];
  for (let i = 0; i < REP_NAMES.length; i++) {
    const r = ROSTER[i % ROSTER.length];
    assignments.push({
      rep: REP_NAMES[i],
      region: r.region,
      team: r.teams[Math.floor(rand() * r.teams.length)],
    });
  }

  return assignments.map(({ rep, region, team }) => {
    const perRep = mulberry32(daySeed(now) ^ hashString(rep) ^ cadence.length);
    const knocksMonth = Math.round(1200 + perRep() * 600);
    const sitsMonth = Math.round(knocksMonth * (0.08 + perRep() * 0.05));
    const closesMonth = Math.round(sitsMonth * (0.3 + perRep() * 0.25));
    const leadToConversion = Math.round(jitter(perRep, 22, 0.3));
    const pullThrough = Math.round(jitter(perRep, 90, 0.07));
    const installsMonth = Math.round(closesMonth * (pullThrough / 100));
    const recruitedQtr = Math.round(perRep() * 4);
    const retention = Math.round(jitter(perRep, 86, 0.1));
    const score = Math.round(
      (Math.min(100, (knocksMonth / 1800) * 100) +
        Math.min(100, (sitsMonth / 150) * 100) +
        Math.min(100, (closesMonth / 20) * 100) +
        Math.min(100, (leadToConversion / 30) * 100) +
        Math.min(100, pullThrough) +
        Math.min(100, (installsMonth / 18) * 100) +
        Math.min(100, (recruitedQtr / 4) * 100) +
        Math.min(100, retention)) / 8,
    );
    return {
      key: rep,
      kind: 'rep' as const,
      label: rep,
      context: `${region} \u00b7 ${team}`,
      region,
      team,
      knocks: scaleCount(knocksMonth, cadence),
      sits: scaleCount(sitsMonth, cadence),
      closes: scaleCount(closesMonth, cadence),
      leadToConversion,
      pullThrough,
      installs: scaleCount(installsMonth, cadence),
      recruited: cadence === 'qtr' ? recruitedQtr : scaleCount(recruitedQtr, cadence),
      retention,
      overall: score,
    };
  });
}

const CADENCE_MULT: Record<Cadence, number> = { day: 1 / 22, week: 1 / 4, month: 1, qtr: 3 };

function scaleCount(base: number, cadence: Cadence): number {
  return Math.max(0, Math.round(base * CADENCE_MULT[cadence]));
}

export function buildScorecards(cadence: Cadence, region: string | null = null, now: Date = new Date()): ScorecardRow[] {
  const rand = mulberry32(daySeed(now) ^ (region?.length ?? 0) ^ cadence.length);
  const pool = region ? [...REP_NAMES].sort(() => rand() - 0.5).slice(0, 12) : [...REP_NAMES];
  const regionTeams = ROSTER.filter(r => region == null || r.region === region).flatMap(r => r.teams);

  return pool.map(rep => {
    const knocksMonth = Math.round(1200 + rand() * 600);
    const sitsMonth = Math.round(knocksMonth * (0.08 + rand() * 0.05));
    const closesMonth = Math.round(sitsMonth * (0.3 + rand() * 0.25));
    const leadToConversion = Math.round(jitter(rand, 22, 0.3));
    const pullThrough = Math.round(jitter(rand, 90, 0.07));
    const installsMonth = Math.round(closesMonth * (pullThrough / 100));
    const recruitedQtr = Math.round(rand() * 4);
    const retention = Math.round(jitter(rand, 86, 0.1));

    // Normalize each bucket to 0-100 against reasonable targets.
    const score = Math.round(
      (Math.min(100, (knocksMonth / 1800) * 100) +
        Math.min(100, (sitsMonth / 150) * 100) +
        Math.min(100, (closesMonth / 20) * 100) +
        Math.min(100, (leadToConversion / 30) * 100) +
        Math.min(100, pullThrough) +
        Math.min(100, (installsMonth / 18) * 100) +
        Math.min(100, (recruitedQtr / 4) * 100) +
        Math.min(100, retention)) /
      8
    );

    return {
      rep,
      team: regionTeams[Math.floor(rand() * regionTeams.length)] ?? regionTeams[0] ?? '—',
      knocks: scaleCount(knocksMonth, cadence),
      sits: scaleCount(sitsMonth, cadence),
      closes: scaleCount(closesMonth, cadence),
      leadToConversion,
      pullThrough,
      installs: scaleCount(installsMonth, cadence),
      recruited: cadence === 'qtr' ? recruitedQtr : scaleCount(recruitedQtr, cadence),
      retention,
      overall: score,
    };
  }).sort((a, b) => b.overall - a.overall);
}

export function buildRegionalSnapshot(region: string, now: Date = new Date()): RegionalSnapshot {
  const full = buildSnapshot(now);
  const rand = mulberry32(daySeed(now) ^ region.length);

  const teamRows = full.pacing.filter(r => r.region === region);
  const teamCount = teamRows.length;
  const bookingsMtd = teamRows.reduce((s, r) => s + r.actualMtd, 0);
  const bookingsTargetMtd = teamRows.reduce((s, r) => s + r.targetMtd, 0) || 1;
  const pacingPct = Math.round((bookingsMtd / bookingsTargetMtd) * 100);
  const installsMtd = Math.round(bookingsMtd * (full.kpis.pullThroughPct / 100));
  const pullThroughPct = Math.round(jitter(rand, full.kpis.pullThroughPct, 0.03));
  const cycleDays = Math.round(jitter(rand, full.kpis.cycleDays, 0.08));
  const repCount = teamCount * 6 + Math.round(rand() * 10);

  // Pull-through funnel \u2014 where my region's deals drop between booking and PTO.
  const funnelDefs = [
    { label: 'Contract \u2192 Credit', base: 97, med: 3 },
    { label: 'Credit \u2192 Survey done', base: 94, med: 6 },
    { label: 'Survey \u2192 Design + Permit', base: 92, med: 18 },
    { label: 'Permit \u2192 NTP', base: 96, med: 4 },
    { label: 'NTP \u2192 Install start', base: 90, med: 14 },
    { label: 'Install \u2192 PTO', base: 93, med: 32 },
  ];
  let standing = bookingsMtd;
  const funnel: FunnelStage[] = funnelDefs.map(f => {
    const rate = Math.round(jitter(rand, f.base, 0.04));
    const dropped = Math.max(0, Math.round(standing * (1 - rate / 100)));
    standing = standing - dropped;
    return { label: f.label, rate, droppedCount: dropped, medianDays: Math.round(jitter(rand, f.med, 0.15)) };
  });

  // Rep roster for this region.
  const regionTeamNames = teamRows.map(t => t.team);
  const repPool = [...REP_NAMES].sort(() => rand() - 0.5).slice(0, Math.max(6, Math.min(12, repCount)));
  const reps: RepCard[] = repPool.map(name => {
    const team = regionTeamNames[Math.floor(rand() * regionTeamNames.length)] ?? regionTeamNames[0];
    const bookingsRep = Math.round(5 + rand() * 32);
    const pt = Math.round(jitter(rand, pullThroughPct, 0.06));
    const roll = rand();
    let status: RepStatus;
    let reason: string;
    if (roll < 0.25) {
      status = 'hot';
      reason = `Up ${Math.round(10 + rand() * 40)}% WoW`;
    } else if (roll < 0.65) {
      status = 'steady';
      reason = `On pace, ${bookingsRep} booked`;
    } else if (roll < 0.9) {
      status = 'cooling';
      reason = `${Math.round(2 + rand() * 7)}d since last booking`;
    } else {
      status = 'flight-risk';
      reason = `No activity ${Math.round(10 + rand() * 10)}d`;
    }
    return { name, team, bookingsMtd: bookingsRep, pullThroughPct: pt, status, reason };
  }).sort((a, b) => b.bookingsMtd - a.bookingsMtd);

  // Stuck deals \u2014 what's red in ops right now, scoped to the region.
  const stageOwners: Array<{ stage: string; owner: string; role: string }> = [
    { stage: 'Permits', owner: 'Amanda Vargas', role: 'Permit coordinator' },
    { stage: 'Credit & Finance', owner: 'Reggie Vance', role: 'Finance ops' },
    { stage: 'Interconnection', owner: 'Priya Thaker', role: 'Interconnection' },
    { stage: 'Install', owner: 'Marcus Hoyt', role: 'Install scheduler' },
    { stage: 'Site Survey', owner: 'Dani Cho', role: 'Survey ops' },
  ];
  const stuckCustomers = ['Thompson, L.', 'Hernandez, M.', 'Rowe, D.', 'Perkins, J.', 'Blount, R.', 'Costa, A.', 'Fuentes, I.', 'Kim, S.'];
  const stuckDeals: StuckDeal[] = Array.from({ length: 6 }, (_, i) => {
    const owner = stageOwners[Math.floor(rand() * stageOwners.length)];
    return {
      customer: stuckCustomers[i] ?? `Customer ${i + 1}`,
      rep: repPool[Math.floor(rand() * repPool.length)] ?? repPool[0],
      team: regionTeamNames[Math.floor(rand() * regionTeamNames.length)] ?? regionTeamNames[0],
      stage: owner.stage,
      daysStuck: Math.round(10 + rand() * 24),
      owner: owner.owner,
      ownerRole: owner.role,
    };
  }).sort((a, b) => b.daysStuck - a.daysStuck);

  // The call list \u2014 top 4 action items for this morning.
  const callList: CallListItem[] = [];
  const topRep = reps.find(r => r.status === 'hot');
  if (topRep) callList.push({
    tone: 'congratulate',
    who: topRep.name,
    context: `${region} \u00b7 ${topRep.team}`,
    why: topRep.reason,
    action: '2-min call. Keep the streak alive.',
  });
  const coachRep = reps.find(r => r.status === 'cooling');
  if (coachRep) callList.push({
    tone: 'coach',
    who: coachRep.name,
    context: `${region} \u00b7 ${coachRep.team}`,
    why: coachRep.reason,
    action: 'Ride-along this week. Ask what dropped.',
  });
  const risk = reps.find(r => r.status === 'flight-risk');
  if (risk) callList.push({
    tone: 'intervene',
    who: risk.name,
    context: `${region} \u00b7 ${risk.team}`,
    why: risk.reason,
    action: 'Pull them in today. Decide stay-or-go.',
  });
  const behindTeam = teamRows.find(t => t.pct < 85);
  if (behindTeam) callList.push({
    tone: 'coach',
    who: behindTeam.team,
    context: `${behindTeam.pct}% to plan`,
    why: `${behindTeam.actualMtd} of ${behindTeam.targetMtd} with days to go`,
    action: 'Team huddle, reset the week.',
  });

  const channel = full.channel;

  return {
    asOf: full.asOf,
    region,
    teamCount,
    repCount: Math.max(repCount, repPool.length),
    bookingsMtd,
    bookingsTargetMtd,
    pacingPct,
    installsMtd,
    pullThroughPct,
    pullThroughDeltaPct: full.kpis.pullThroughDeltaPct,
    cycleDays,
    funnel,
    callList,
    teamRows,
    reps,
    stuckDeals,
    sla: full.sla,
    channel,
  };
}
