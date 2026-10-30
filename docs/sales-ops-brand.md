# Sales dashboard — brand + build spec

A self-contained brand kit for a dark, mono-accented sales dashboard. Use this to match the look of the dashboard you were sent. Everything you need is inline — no external files to pull.

---

## 1. The feel

- Dark navy page, white text, one yellow accent per view.
- Big uppercase display headlines, two to four words with one word in yellow.
- Mono-font micro labels above sections ("INSTALL SPEED," "BLITZ TRACKING").
- Pill-shaped controls, no shadows, no gradients, no emojis.
- Enterprise information density, but calm. Nothing fights for attention except the one yellow thing per screen.

---

## 2. Design tokens

Define these once and reuse everywhere. Do not pick arbitrary hex values.

```ts
// Fonts
const SANS    = 'var(--font-sans), -apple-system, system-ui, sans-serif';
const DISPLAY = 'var(--font-display), "Archivo Black", Impact, sans-serif';
const MONO    = 'var(--font-mono), ui-monospace, monospace';

// Backgrounds
const INK        = '#0D1023';            // page background
const SURFACE    = '#171B38';            // cards, pills, inputs
const SURFACE_HI = '#242A58';            // raised / hover
const LINE       = 'rgba(255,255,255,0.08)';  // subtle divider
const LINE_HI    = 'rgba(255,255,255,0.15)';  // visible border

// Text
const TEXT   = '#FFFFFF';
const SUBTLE = '#CED3E8';   // secondary copy
const MUTED  = '#8B91B5';   // labels, timestamps, placeholders

// Accents
const SUN    = '#FAD646';   // single highlight color — primary CTA, selected state
const GOOD   = '#5EE493';   // on-pace / healthy
const WATCH  = '#FFD54F';   // soft warning
const BEHIND = '#FF5E7A';   // behind / blocked
```

Rules of thumb:
- Page is `INK`. Everything that sits on the page is `SURFACE`. Raised / hovered things are `SURFACE_HI`.
- `LINE_HI` for interactive borders, `LINE` for pure dividers.
- `SUN` is the only "look-at-me" color. Exactly one `SUN` focal point per screen — the primary action, the selected pill, the hero accent word. Never fill large regions with it.
- `GOOD` / `WATCH` / `BEHIND` are text or dot colors, never backgrounds.

---

## 3. Fonts

Three Google fonts, loaded once. Framework-agnostic version:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">

<style>
  :root {
    --font-display: 'Archivo Black', Impact, sans-serif;
    --font-sans:    'Geist', -apple-system, system-ui, sans-serif;
    --font-mono:    'Geist Mono', ui-monospace, monospace;
  }
</style>
```

Next.js version:

```ts
import { Archivo_Black, Geist, Geist_Mono } from 'next/font/google';

const display = Archivo_Black({ subsets: ['latin'], weight: '400', variable: '--font-display', display: 'swap' });
const sans    = Geist({         subsets: ['latin'], variable: '--font-sans',    display: 'swap' });
const mono    = Geist_Mono({    subsets: ['latin'], variable: '--font-mono',    display: 'swap' });
```

Where each font goes:
- **Display (Archivo Black)** — hero headlines, section labels, pill text, big state abbreviations on cards. Always `text-transform: uppercase`, letter-spacing `0.08em` to `0.14em`.
- **Sans (Geist)** — body copy, buttons, inputs, table cells.
- **Mono (Geist Mono)** — all numbers, dates, status chips, data labels, eyebrows. Always uppercase, letter-spacing `0.14em` to `0.3em`, size 10–12px.

---

## 4. Page skeleton

Every page follows the same vertical rhythm:

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  INSTALL SPEED           ← eyebrow (mono, 11px, SUN, 0.3em)    │
│  WHERE THE FLOOR         ← h1 (display, uppercase, 36–72px)    │
│  MOVES FASTEST.          ← second line, one yellow word        │
│  One sentence of context, Subtle color, max-width ~580px.      │
│                                                                │
├────────────────────────────────────────────────────────────────┤  ← LINE_HI
│  Channel ⚫ Direct  EPC   Window ⚫ 90d  1yr  All   Metric [▾] │  ← controls
├────────────────────────────────────────────────────────────────┤
│  US ›  CONNECTICUT ›  064XX                                    │  ← breadcrumb
├────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────┐ ┌────────────────────────┐│
│ │                                  │ │  TOP 5 FASTEST         ││
│ │                                  │ │                        ││
│ │           MAIN CANVAS            │ │   1  CA  Los Angeles 72││
│ │        (map, chart, grid)        │ │   2  TX  Austin      68││
│ │                                  │ │   3  FL  Tampa       65││
│ │                                  │ │                        ││
│ │                                  │ │   SEE ALL 48           ││
│ └──────────────────────────────────┘ └────────────────────────┘│
│   SHOW TABLE                                                   │
└────────────────────────────────────────────────────────────────┘
```

- 20px side padding, no max-width.
- Hero `padding: 32px 20px 10px`.
- Primary grid: `grid-template-columns: minmax(0, 1fr) 300px; gap: 16px`.
- The right rail is 300px wide, context-aware (changes based on what's selected).

---

## 5. Component recipes

### Pill button (toggle)

```tsx
<button
  onClick={() => setActive(key)}
  style={{
    background: isActive ? SUN : SURFACE,
    color:      isActive ? INK : TEXT,
    border:     `1px solid ${isActive ? SUN : LINE_HI}`,
    borderRadius: 999,
    padding: '9px 14px',
    fontFamily: SANS,
    fontSize: 13,
    cursor: 'pointer',
  }}
>
  {label}
</button>
```

### Pill group with mono label

```tsx
<div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
  <span style={{
    fontFamily: MONO, fontSize: 10,
    letterSpacing: '0.22em', color: MUTED,
    textTransform: 'uppercase',
  }}>
    Channel
  </span>
  <div style={{ display: 'inline-flex', gap: 6 }}>
    {options.map(o => <PillButton key={o.key} {...o} />)}
  </div>
</div>
```

### Card

```tsx
<div style={{
  background: SURFACE,
  border: `1px solid ${LINE_HI}`,
  borderRadius: 12,
  padding: '18px 20px',
}}>
  {/* no box-shadow — the border and the dark page do the work */}
</div>
```

### Hero

```tsx
<section style={{ padding: '32px 20px 10px' }}>
  <div style={{
    fontFamily: MONO, fontSize: 11,
    letterSpacing: '0.3em', color: SUN,
    textTransform: 'uppercase', marginBottom: 10,
  }}>
    Blitz tracking
  </div>
  <h1 style={{
    margin: 0,
    fontFamily: DISPLAY,
    fontSize: 'clamp(36px, 6vw, 72px)',
    lineHeight: 0.95,
    letterSpacing: '-0.02em',
    textTransform: 'uppercase',
    color: TEXT,
  }}>
    Two words,<br />
    <span style={{ color: SUN }}>then the hook.</span>
  </h1>
  <p style={{
    marginTop: 12, maxWidth: 580,
    color: SUBTLE, fontSize: 14, lineHeight: 1.6,
  }}>
    One sentence of context. No marketing voice.
  </p>
</section>
```

### Controls strip

```tsx
<div style={{
  display: 'flex', flexWrap: 'wrap', gap: 12,
  alignItems: 'center', padding: '14px 20px',
  background: INK, borderBottom: `1px solid ${LINE_HI}`,
  fontFamily: SANS,
}}>
  <PillGroup label="Channel" ... />
  <PillGroup label="Window"  ... />
  <input
    type="search"
    placeholder="Search team, rep, or market"
    style={{
      flex: 1, minWidth: 200, maxWidth: 320,
      padding: '10px 14px',
      background: SURFACE,
      color: TEXT,
      border: `1px solid ${LINE_HI}`,
      borderRadius: 999,
      outline: 'none',
      fontSize: 13,
      fontFamily: SANS,
    }}
  />
</div>
```

### Breadcrumb

```tsx
<nav style={{
  padding: '10px 20px',
  fontFamily: MONO, fontSize: 11,
  letterSpacing: '0.22em', textTransform: 'uppercase',
}}>
  {crumbs.map((c, i) => (
    <span key={c.key}>
      <button
        onClick={c.onClick}
        style={{
          background: 'transparent', border: 0, padding: 0,
          color: i === crumbs.length - 1 ? SUN : MUTED,
          fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit',
          cursor: c.onClick ? 'pointer' : 'default',
        }}
      >
        {c.label}
      </button>
      {i < crumbs.length - 1 && <span style={{ color: MUTED, margin: '0 8px' }}>›</span>}
    </span>
  ))}
</nav>
```

Separator is ` › ` (U+203A). Current crumb in `SUN`, prior crumbs in `MUTED` and clickable.

### Metric row (right-rail list item)

```tsx
<button style={{
  display: 'grid',
  gridTemplateColumns: '26px 48px 1fr auto',
  gap: 10, alignItems: 'center',
  padding: '9px 12px',
  background: SURFACE,
  border: `1px solid ${LINE_HI}`,
  borderRadius: 8,
  cursor: 'pointer', color: TEXT, textAlign: 'left',
}}>
  <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>1</span>
  <span style={{ fontFamily: DISPLAY, fontSize: 13, letterSpacing: '0.08em', color: SUN }}>CA</span>
  <span style={{ fontSize: 12, color: SUBTLE }}>Los Angeles</span>
  <span style={{ fontFamily: MONO, fontSize: 12, color: TEXT, fontWeight: 700 }}>72d</span>
</button>
```

### Status chip (text with colored dot)

```tsx
<span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
  <span style={{
    display: 'inline-block', width: 8, height: 8,
    borderRadius: '50%', background: GOOD, marginRight: 6,
  }} />
  <span style={{ color: SUBTLE }}>On pace</span>
</span>
```

Swap `GOOD` for `WATCH` or `BEHIND` as needed.

### Floating help button (optional, bottom-right)

```tsx
<button
  aria-label="Open help"
  style={{
    position: 'fixed', bottom: 24, right: 24,
    width: 60, height: 60, borderRadius: '50%',
    background: SUN, color: INK, border: 0,
    cursor: 'pointer',
    boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 90,
  }}
>
  {/* chat / help icon */}
</button>
```

This is the only place a `box-shadow` is permitted.

---

## 6. Voice

- Headlines are two to four words plus a hook. Never a full sentence.
- Section eyebrows are one or two words, uppercase mono. "INSTALL SPEED," "BLITZ TRACKING," "DEALS TODAY."
- Buttons: one word, uppercase, display font. "BLITZ," "LAUNCH," "REVIEW." Never "Click here to…"
- Numbers are the hero. A table cell showing `72d` in mono is more valuable than a sentence explaining it.
- If a sentence sounds like Salesforce, cut it.

---

## 7. Mobile

- Grid stacks: hero → controls (horizontal scroll chip row) → breadcrumb → main canvas (full width) → bottom sheet for the right rail / tables.
- Table and secondary rails become a drag-up bottom sheet, hidden by default.
- Pill controls stay the same height (34px) on mobile — no shrinking.
- Floating help button moves to `bottom: 16px; right: 16px`.
- No hover states on touch — everything responds to tap.

---

## 8. Pre-ship checklist

- Page background is `#0D1023`, nothing else.
- Hero uses Archivo Black uppercase with exactly one yellow word.
- Every control is pill-shaped (`border-radius: 999px`).
- Every number is in Geist Mono.
- Yellow (`#FAD646`) appears exactly once per screen as the focal point.
- No `box-shadow` anywhere except the floating help button.
- No emojis anywhere.
- No gradients anywhere.
- Mono eyebrows above every section, 10–11px, letter-spaced 0.22–0.3em.

---

## 9. Reference URL

If you want to pattern-match a live screen while building:

```
URL:      uelogy.com/sales-ops
Password: Kapil
```

Walk the hero → controls → breadcrumb → grid → right-rail rhythm on any of the sub-pages. The structure is identical.
