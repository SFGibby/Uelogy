# Sales Ops Hub — v1 beta — design

Date 2026-10-28 · Owner Sam Gibson · **INTERNAL ONLY**

Mounts a beta sales-operations hub on uelogy.com so SunPower sales execs and regional managers can touch a leader-facing view of ops reality (SLAs, pacing, pipeline) alongside the existing SunPower resource guide, with a feedback-only chatbot. Final destination is WIN; uelogy.com is the beta demo surface so people can click it before it lands inside.

---

## 1 · Scope

**In for v1 (ship-by-tomorrow beta):**
- Hub shell: route, password gate, SPC WIN light theme, SunPower topbar, role toggle (cosmetic)
- `/sales-ops` landing: KPI tiles, SLA scorecard, team pacing table, nav to subpages
- `/sales-ops/resources`: port of the SunPower Finance Resource Guide (6 tabs), Supabase-backed so edits persist
- `/sales-ops/feedback`: intent-router chatbot (keywords → links to the right resource section; everything else → logged to a feedback table)
- Fake, deterministic ops data for the landing

**Deferred to v2+ (each a separate spec and session):**
- `/sales-ops/map` — install-speed geography (port of `sales-planning-install-speed_2026-10-14.html`)
- `/sales-ops/allocation` — BOQ4 geo allocation (port of `geo-allocation-boq4_2026-10-19.html`)
- Adder sheet editor (full merdeka-style grid)
- Role-based write permissions (v1 role toggle is cosmetic only)
- Chatbot NLP / LLM Q&A against the resource guide KB
- Chatbot proposing site-data changes for approval

**Explicit non-goals:**
- No live Snowflake / Salesforce / merdeka data
- No real auth beyond a shared password cookie
- No cross-pollination with uelogy's arcade chrome; this surface is SunPower-themed only

---

## 2 · Mount and auth

- Route: `/sales-ops` (new).
- Cookie: `sales_ops_auth`, HttpOnly, SameSite=Lax, 1-year maxAge, Secure in prod. Same shape as `grid_auth` / `ledger_auth`.
- Gate: extend `app/api/grid/unlock/route.ts` to add `sales_ops` to the `GATES` map: `{ cookie: 'sales_ops_auth', env: 'SALES_OPS_PASSWORD', fallback: 'Operator' }`. Lock route (`app/api/grid/lock/route.ts`) already clears both existing gates; extend it to clear `sales_ops_auth` too.
- Entry gate on `/sales-ops` and all `/sales-ops/*` reads the cookie server-side; absent → render the unlock modal (mirror the Ledger copy pattern: `AUTHORIZATION REQUIRED · Sales Ops · Enter the operations hub.`).
- Env: `SALES_OPS_PASSWORD` in `.env.local` (Sam sets per-deploy); fallback `Operator` lets local dev work without the env.

## 3 · Routes

### 3.1 `/sales-ops` — landing

Single scroll, four blocks top to bottom:

**Topbar** — `SunPower® · Sales Ops · Operations Hub` wordmark left; role toggle right (`Exec | Regional` segmented control, plus a region dropdown when Regional is selected). State in `localStorage.sales_ops_role` and `localStorage.sales_ops_region`.

**KPI banner** — 4 tiles in one row:
- Bookings MTD (count + delta vs. same point last month)
- Installs MTD (count + delta)
- Open Pipeline ($ value)
- Avg Cycle Days (booking → install, trailing 90d)

**SLA scorecard** — 4 cards in one row:
- Proposal → Contract median (target 7d)
- Contract → Permit median (target 14d)
- Install → PTO median (target 30d)
- Pending escalations count (target < 20)

Each card: label, big number, target line, pacing chip (On-pace / Watch / Behind) using `#2E7D32` / `#FAD646` outline / `#C62828`.

**Team pacing table** — Rows = Region → Team. Columns: Target, Actual, % to Target, Trend 4-week sparkline. Sortable by any column. In Regional role, filtered to the selected region.

**Nav tiles** — footer row of large cards linking to `/sales-ops/resources` and `/sales-ops/feedback`. Placeholder tiles for `/sales-ops/map` and `/sales-ops/allocation` labeled "Coming soon" (disabled).

### 3.2 `/sales-ops/resources` — port of the Finance Resource Guide

Port `sunpower-resource-guide (1).html` with these changes:

- Tabs preserved exactly: `Contact Guide`, `Finance Resource Guide`, `Financing Calculator`, `Adders Guide`, `Equipment Guide`, `FAQs`.
- Content model moved from inline HTML to Supabase so edits persist across visitors (see §5 schema).
- Global search box behavior preserved (searches across tabs).
- Admin edit mode (contentEditable + "save" banner) is Exec-only in v1 (cosmetic gate: hide the banner when role=Regional).
- Keep the SunPower topbar from §3 above the tab bar.
- Keep the "🔒 Confidential · Internal Use Only" hero line verbatim.

### 3.3 `/sales-ops/feedback` — intent-router chatbot

Two-column layout. Left: chat transcript. Right rail: "Common asks" (clickable chips that pre-fill the input).

Intent router (deterministic keyword match, no LLM in v1). Case-insensitive, matches whole-word; first match wins:

| Keyword(s) | Response |
|---|---|
| adder, adders, pricing adder | "Here you go." Link: `/sales-ops/resources?tab=adders` |
| finance, financier, lender | Link: `/sales-ops/resources?tab=finance` |
| calculator, calc | Link: `/sales-ops/resources?tab=calc` |
| equipment, panel, inverter, battery, powerwall | Link: `/sales-ops/resources?tab=equipment` |
| contact, who do i call, phone, email | Link: `/sales-ops/resources?tab=sales` |
| faq, faqs, frequently | Link: `/sales-ops/resources?tab=faqs` |
| map, geography, zip, install speed | "That view is coming soon. We'll notify you when it lands." |
| allocation, bookings plan, boq4 | "That view is coming soon." |
| no match | "Got it — I'll pass this along to Sam." + logs the message. |

Every message (matched or not) writes a row to `sales_ops_feedback` (`intent`, `user_text`, `role`, `region`, `created_at`). Matched messages log the matched intent; unmatched log `intent=null` so Sam can review and seed new intents.

Common-asks chips: "Where are the adders?", "Who do I call for a deal question?", "Where's the financing calculator?", "What panels do we offer?", "FAQ about PPAs".

## 4 · Data

### 4.1 Fake ops data

`lib/sales-ops/fake-ops-data.ts` — deterministic generator seeded by `YYYY-MM-DD` so refreshing within a day yields identical numbers, next day shifts realistically.

Ranges anchored to the real spec (`sales-planning-spec_2026-10-28.md` §3):
- Install cycle time median ≈ 74d (sample from 60-95d)
- Bookings per quarter ≈ 1029 (MTD ≈ 350, with ±15% jitter)
- Trailing-12 installs ≈ 3,293; MTD ≈ 275
- Pipeline $ at ~ $45k avg deal × open deal count (3-5x MTD bookings)

Team rows: use the real region/team names observed from merdeka — Regions `Blue Raven`, `Movement`, `"Solar's Dead"`, `Precision`; teams nested (e.g. Movement → EXODUS (NV/OR), X Pros, Philly, Bend (OR), Summit (OR), RTL (OR); Blue Raven → The Sunny D (MI), Shockwave (Wilmington), Raleighwood (NC), AbsoluT (CO); Solar's Dead → CTRL, AEROTYNE; Precision → Gldn).

Fake targets per team: fixed in-file so pacing feels real (ranging 40-220 bookings/mo per team).

### 4.2 Resource guide content

One-time seed script `scripts/seed-sales-ops-resources.ts` parses `sunpower-resource-guide (1).html` and inserts rows into `sales_ops_resource_*` tables. After seed, the guide is edited through the UI (Exec role) and persists to Supabase.

## 5 · Supabase schema (`supabase/sales-ops-schema.sql`)

```sql
create table sales_ops_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  role text,            -- 'exec' | 'regional'
  region text,          -- nullable
  user_text text not null,
  intent text,          -- nullable when no keyword matched
  status text not null default 'new'  -- 'new' | 'reviewed' | 'actioned'
);

create table sales_ops_resource_tabs (
  key text primary key,       -- 'sales' | 'finance' | 'calc' | 'adders' | 'equipment' | 'faqs'
  label text not null,
  position int not null
);

create table sales_ops_resource_sections (
  id uuid primary key default gen_random_uuid(),
  tab_key text not null references sales_ops_resource_tabs(key),
  section_key text not null,  -- stable slug for linking (#adders, etc.)
  title text not null,
  description text,
  position int not null,
  unique (tab_key, section_key)
);

create table sales_ops_resource_cards (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references sales_ops_resource_sections(id) on delete cascade,
  position int not null,
  kind text not null default 'info',  -- 'info' | 'highlight' | 'contact' | 'adder'
  title text,
  body text,          -- HTML allowed; sanitized on write
  highlight boolean not null default false
);
```

RLS: match `leaderboards`/`collection` pattern. Public SELECT on all three resource tables (so the gate cookie is the only control). INSERT/UPDATE on resource tables restricted to `authenticated` (deferred — v1 reads/writes via server routes using the service role key, no row-level write access from the browser). `sales_ops_feedback`: INSERT open (anonymous feedback), SELECT/UPDATE restricted (Sam reviews in Supabase UI directly).

## 6 · Design system

Strict adherence to SPC Design System (WIN light / board B):

- **Type:** Arial only. No webfonts.
- **Palette:** `--navy #162241`, `--yellow #FAD646`, `--grey #DFE3EB`, `--primary #0056B8`, `--good #2E7D32`, `--bad #C62828`, white backgrounds.
- **Charts:** max 3 colors each. Yellow never for text. No gradients. No decorative shadows.
- **Chrome:** no emojis as decoration (the resource guide's "🔒 Confidential" line is content, not decoration — keep it). No cards inside cards. No em dashes in UI copy.
- **Topbar height:** 56px. Divider: 1px `--grey`.
- **KPI tiles:** white card, 1px `--grey` border, number in `--navy` 32px bold, label in uppercase 11px tracked.
- **Pacing chips:** `--good` background for On-pace; `--yellow` border + navy text for Watch; `--bad` background + white text for Behind.

Tailwind config: extend theme with these color tokens so classes read `bg-sales-ops-navy`, etc. Scope the override to `/sales-ops/*` so the arcade pages are untouched.

## 7 · File layout (new)

```
app/
  sales-ops/
    layout.tsx              # gate check, topbar, role toggle
    page.tsx                # landing (§3.1)
    resources/
      page.tsx              # tabs shell (§3.2)
      [tab]/page.tsx        # per-tab content
    feedback/
      page.tsx              # chat UI (§3.3)
  api/
    sales-ops/
      feedback/route.ts     # POST feedback
      resources/route.ts    # PATCH resource card (Exec only)
    grid/
      unlock/route.ts       # extend GATES map
      lock/route.ts         # extend clear list

components/
  sales-ops/
    Topbar.tsx
    RoleToggle.tsx
    UnlockGate.tsx
    KpiTile.tsx
    SlaCard.tsx
    PacingTable.tsx
    NavTile.tsx
    ResourceTabs.tsx
    ResourceSection.tsx
    ResourceCard.tsx
    FeedbackChat.tsx
    IntentRouter.ts

lib/
  sales-ops/
    fake-ops-data.ts        # deterministic generator
    supabase.ts             # typed client wrapper
    intents.ts              # keyword → response map

scripts/
  seed-sales-ops-resources.ts

supabase/
  sales-ops-schema.sql
```

## 8 · Open items I'm defaulting on (Sam can override)

- Mount path `/sales-ops` (vs. `/win` / `/sales-ops-hub`).
- Beta password `Operator`.
- Topbar wordmark exact: `SunPower® · Sales Ops · Operations Hub`.
- Feedback destination: Supabase only (no email forwarding in v1).

## 9 · Done means

- Deployed to Vercel on `main`.
- Password `Operator` unlocks `/sales-ops`.
- Landing renders KPIs + SLAs + a pacing table with ~5 regions × ~15 teams, numbers stable within a day.
- Resources tab shows the 6 ported tabs; search works across tabs; exec role sees edit affordances; edits persist to Supabase.
- Feedback intent router returns correct links for the keyword list in §3.3; unmatched messages log to `sales_ops_feedback` with role + region.
- No console errors. Lighthouse mobile score ≥ 85.
