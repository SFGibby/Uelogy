# Collection redesign — Binder + bulk-add UX

**Date:** 2026-05-25
**Status:** Design approved, ready for implementation
**Scope:** `/collection` (public binder), `/collection/admin` (private tracker), bulk-add flows

---

## Problem

Two problems, equal weight:

1. **"100s of cards" is the actual UX problem.** The existing `CollectionTracker.tsx` adds one card at a time through a modal. Sam can't realistically log a 200-card collection that way — it would take hours of mouse work. The site has no bulk-add path.
2. **Visual identity is generic.** Current design is dark background + colored blur blobs — the same cookie-cutter glassmorphism flagged elsewhere on the site. Doesn't feel "different" from home or learning. No metaphor.
3. **Public vs private confusion.** The page is a portfolio (visible to anyone) but exposes Add / Edit / Delete / CSV-Export controls inline. A visitor sees admin tools they shouldn't have.

## Goal

- A public binder portfolio at `/collection` that's beautiful, browseable, and read-only.
- A private tracker at `/collection/admin` that's keyboard-fast for entering hundreds of cards.
- Same Supabase data underneath.

## Metaphor

**Card binder.** The real-world artifact collectors use. Each "page" is a 3×3 grid of card sleeves. Visitors flip pages. Filter chips switch between MTG / Pokémon / Sports / Memorabilia / All. The metaphor is collector-honest, scales naturally to hundreds of cards, and is visually distinct from the rest of the site.

## Information architecture

```
/collection            → Public binder (read-only display)
/collection/admin      → Private tracker (add / edit / delete / import)
                          gated by env-token query param + localStorage cache
```

Same Supabase `collection` table, two views.

## Public binder (`/collection`)

- 3×3 grid of card sleeves on a binder page background. Page turn animation between pages.
- Filter chips at top: `All`, `MTG`, `Pokémon`, `Sports`, `Memorabilia`. Filter is client-side (we already fetch the whole collection on load — that's fine for hundreds of items).
- Sleeve shows the card image (if present) or a typed placeholder (CSS-rendered, no emoji — current placeholder pattern is fine, just restyled to match binder).
- Click a sleeve → modal with full card details (name, set, condition, grade, value if shown, notes).
- No Add / Edit / Delete buttons. No CSV Export button.
- Music: KH2 "Dearly Beloved" toggle in the bottom-left corner. Click-to-play (no autoplay — browsers block it anyway). Same toggle styling as the home page music button.

## Private tracker (`/collection/admin`)

The fast-data-entry surface. Auth-gated lightly (see "Gate" section below).

### Quick-Add bar (primary input)

Top of the page, always focused on load. One text input. Behavior:

1. Type a card name. After 300ms debounce, query the appropriate API (see "Card lookup" below).
2. Dropdown shows top ~6 matches with thumbnail + set + (game) label.
3. Arrow keys navigate; Enter selects; Tab also selects and moves to qty.
4. On selection, a row of optional inline fields appears: quantity (default 1), condition (default NM), purchase price, grade, notes.
5. Press Enter at any point to save the row to Supabase. Input clears. Focus returns to the search box.
6. Recently-added cards stack visibly below the input (last 10) so Sam can see his progress and undo if he fat-fingered something.

Result: a 200-card collection enters in a single keyboard-driven session.

### Card lookup — APIs

| Type | Source | Endpoint shape |
|------|--------|---------------|
| MTG | Scryfall | `GET https://api.scryfall.com/cards/autocomplete?q=<q>` for suggestions, `GET https://api.scryfall.com/cards/named?fuzzy=<name>` for card data |
| Pokémon | Pokémon TCG API | `GET https://api.pokemontcg.io/v2/cards?q=name:<q>*&pageSize=6` (requires `X-Api-Key` header — free tier available) |
| Sports | Sports Card DB / TCGdex | TBD on best free source. v1 falls back to manual entry for sports until we pick. |
| Memorabilia | None | Manual entry only — no API exists for autographed shoes, etc. |

A type selector sits next to the quick-add input (MTG / Pokémon / Sports / Memorabilia / Other). Determines which API the search hits. Default sticks across sessions via localStorage.

### CSV / paste import (escape hatch)

"Import" button opens a modal with two tabs: **Upload file** and **Paste rows**. Either way:

1. First row treated as header. Sam maps columns to schema fields (name, type, set, condition, grade, purchase price, qty, notes).
2. Preview table shows first 10 parsed rows with validation status. Bad rows are flagged (missing required fields, unrecognized type) but don't block good rows.
3. "Import N valid rows" button commits to Supabase. Errors return a downloadable report of failed rows.

Covers: memorabilia, existing spreadsheets, batch dumps where typing each card would be slower than pasting.

### Existing controls

Edit, delete, CSV export — keep as-is, just live on the admin route. No changes to functionality, just relocation.

## Gate (admin access)

Lightweight. Personal site, not a bank.

1. `/collection/admin` reads `?token=<value>` query param.
2. If it matches `process.env.COLLECTION_ADMIN_TOKEN`, set a flag in localStorage and render the admin UI. Subsequent visits skip the query param.
3. If no match, redirect to `/collection` (the public binder).
4. A "log out" button clears the localStorage flag.

This is not real auth. It's a soft fence so a random visitor can't see Add/Delete buttons. Anyone Sam shares the token URL with can edit — fine for now.

If Sam wants real Supabase Auth later, that's a v2 swap.

## Supabase changes

None required. Existing `collection` table schema (name, type, set_name, condition, grade, purchase_price, avg_sold_price, notes, player, quantity, image_url, etc.) is sufficient for everything in this design.

RLS: Optional v2. For v1, the table is open for reads + writes — the admin gate is client-side. Acceptable for a personal portfolio.

## What changes / what stays

**Stays:**
- Supabase schema and existing data.
- CSV export.
- Click-to-play music (just made explicit instead of autoplay).
- `CollectionItem` type and `supabase.ts` helpers.

**Changes:**
- `/collection` becomes the binder (read-only).
- `CollectionTracker.tsx` becomes the admin view at `/collection/admin`, with the Quick-Add bar grafted on top of the existing add/edit/delete affordances.
- Visual chrome: dark + blur blobs → binder pages.

**Removed:**
- Autoplay behavior on `/collection` (already broken by Chrome's autoplay policy — making it click-to-play formalizes the working state).
- Any colored ambient blur blobs (`<div style={{ position: 'absolute', ... radial-gradient ... }} />` pattern).
- Add/Edit/Delete/Export controls from the public binder route.

## Implementation order (priority)

1. **Quick-Add bar with Scryfall (MTG)** — biggest UX unblock. Ship this first, even before the visual redesign. Sam can start logging cards immediately.
2. **Pokémon TCG API + manual mode for sports/memorabilia.**
3. **CSV import modal.**
4. **Route split** — move admin out to `/collection/admin`, add the token gate, make `/collection` read-only.
5. **Binder visual redesign** — the cosmetic chrome swap. Comes last because it doesn't unblock any user pain.

Ship-able at each step. No flag-day deployment.

## Out of scope (v1)

- Set checklist mode ("pick a set, click cards you own").
- Phone camera OCR / vision scan.
- Multi-user / sharing.
- Real Supabase Auth.
- Sports card API — research and pick in v2.
- Price refresh / sync from external sources.

## Risks

- **Scryfall rate limit** (~10 rps unauthed). Mitigation: debounce input, don't fire on every keystroke. For Sam's solo use it's a non-issue.
- **Pokémon TCG API key** needs to be obtained and stored in env. Mitigation: free tier, easy signup, gate the Pokémon search behind key-present check (fall back to manual mode if missing).
- **The admin token is client-checked** — anyone reading client JS will see the gate logic but not the token (the comparison happens server-side via env var). Still: don't put real secrets in this token. If Sam wants real security, swap to Supabase Auth.
- **Binder page-turn animation** can be a CSS performance trap if not done carefully. Mitigation: use CSS transforms, not layout-affecting properties; test on mobile.
