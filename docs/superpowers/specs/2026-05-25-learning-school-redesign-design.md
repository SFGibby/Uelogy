# Learning page redesign — School with Professor Uel

**Date:** 2026-05-25
**Status:** Design approved, ready for implementation plan
**Scope:** `/learning` (index) and `/learning/sql` (only existing classroom)

---

## Problem

The current `/learning` route is a single SQL tutorial dressed up in a tangle of mismatched aesthetics: starfield background, moonlight glow, a Solar Village pixel-art banner, an amber teacher sprite, and an LMS-style sidebar layout. Every visual element is from a different world. There's no framing for "this is the first of many things I'm learning in public" — adding a second subject (Python, dbt, whatever comes next) would require either bolting on a navigation layer or building a parallel route from scratch.

## Goal

A public learning log structured as a **school**. The index is a hallway lined with doors, one per subject. Each classroom is its own world (room-specific decor, color palette, content) but shares the school chrome — same Professor Uel character, same architectural language. New subjects = new classrooms, no architecture change.

## Frame & metaphor

- **School** is the section.
- **Hallway** is the index at `/learning`.
- **Classroom** is each subject at `/learning/<subject>` (e.g. `/learning/sql`).
- **Lessons** live inside a classroom — broken down within that room, not surfaced at the hallway level.
- **Professor Uel** is the through-line teacher character, present in every classroom and standing in the hallway.

The "each page is its own world" rule is preserved because each classroom is visually distinct. The school is just the connective tissue.

## Information architecture

```
/learning                 → Hallway (index)
/learning/sql             → SQL classroom (existing engine, new chrome)
/learning/<future>        → Future classrooms, scaffolded for copy-paste
```

No per-lesson URLs. Lessons remain anchor-state inside the classroom (matches current behavior where lesson selection is handled by `SQLLearn` component state).

## Hallway design (`/learning`)

**Visual:** Pixel-art side view of a school corridor. Floor, ceiling lights, lockers along the back wall, a row of classroom doors. Style consistent with existing SoS-aesthetic pixel art (SamSprite, SolarVillage, TeacherSprite all live in `components/`).

**Doors:**
- **Built classroom** = door slightly ajar with light spilling out. Label above the door reads the subject name in pixel-block lettering (`SQL`). Click navigates to the classroom.
- **Future classroom** = closed door with a small sign that reads "Coming soon" or similar. Non-interactive (cursor stays default).
- The hallway has space for ~5 doors visible; if more subjects exist, hallway extends horizontally and scrolls.

**Professor Uel:** Stands in the hallway near the entrance. Has a small dialogue bubble that rotates between welcome lines (e.g. "Pick a room.", "What're we studying?"). The dialogue rotation can be a simple `useState` cycle on an interval.

**Page chrome:** Header with the section title (`School` or `Learning` — see open questions). No traditional Nav since `Nav.tsx` already renders globally.

## Classroom design (using SQL as the reference)

The existing `SQLLearn.tsx` engine stays — lesson list, in-browser sql.js editor, concept text, run/check loop, progress state. The visual chrome wrapping it is replaced.

**Replacements:**
- **Starfield + moonlight glow background** → classroom background. For SQL: warm amber-tinted plaster walls with a slight grain texture. Future subjects pick their own wall treatment via theme variables.
- **SolarVillage banner** → **chalkboard at top** showing the active lesson title in chalk-style handwriting. The chalkboard also surfaces the lesson's "concept" text on one half, with Professor Uel sprite next to it (pointing pose).
- **Lessons sidebar** → **locker bank** along the left edge, one locker per lesson. Locker has the lesson number stenciled on it, a lock icon for not-yet-unlocked lessons, and a small green light or dot for completed ones. Clickable; active locker is highlighted (open door or interior glow).
- **SQL editor + results panel** → presented as if on a **wooden desk surface**. Editor and result area sit on a desk-textured container. Buttons (Run, Reset) styled like desk tools (e.g. inkwell, eraser) — restrained, not gimmicky.
- **TeacherSprite** → **Professor Uel sprite** with multiple poses (pointing at chalkboard, idle, celebrating on completion).

**Color palette per subject:** Each classroom defines its own palette via CSS variables. SQL keeps its amber (`#d97706`-ish) accent because it reads warm and classroom-y. Future subjects pick their own.

**Engine isolation:** Lesson logic (sql.js init, query execution, completion tracking, progress persistence) stays in `SQLLearn.tsx`. Only the visual wrapper is rebuilt. This means a future classroom shares the **classroom layout component** (chalkboard, desk, locker board, Uel slot) but plugs in its own lesson engine.

## Professor Uel — the character

- One pixel-art character used across all classrooms and the hallway.
- Generated via the existing PixelLab pipeline (per `reference_pixellab` memory).
- Multiple poses needed initially: hallway idle, chalkboard pointing, desk standing, celebration.
- Rename `TeacherSprite.tsx` → `ProfessorUel.tsx`. Component accepts a `pose` prop. Each pose is its own PNG.
- Same color scheme regardless of room. Uel is a constant; the room changes around him.

## Scaffolding for future classrooms

Refactor target: extract a `Classroom` layout component that future subjects compose:

```tsx
<Classroom theme={SqlTheme}>
  <Chalkboard title={lesson.title} concept={lesson.concept} />
  <LessonsBoard lessons={LESSONS} active={active} onSelect={...} />
  <Desk>
    <SQLEditor />
    <ResultsPanel />
  </Desk>
</Classroom>
```

Where:
- `Classroom` provides background, chrome, Uel slot, common spacing.
- `theme` is a CSS-variable object (wall color, accent, chalk color, etc.).
- The lesson engine inside `<Desk>` is subject-specific.

Adding a new subject becomes: pick a theme palette, supply a `LESSONS` array, drop in a new editor/interaction component for `<Desk>`.

## Asset pipeline

PixelLab generates:
- Hallway background (floor, lockers, lights).
- Each door (built + future + sign).
- Professor Uel sprite, several poses.
- Per-classroom decor (chalkboard, desk, bulletin board) — start with one shared set, override per subject if needed.

Cost-control: generate the minimum needed to ship the hallway + SQL classroom. Add more assets as new subjects are added. Don't over-generate.

## What stays the same

- All lesson content (the `LESSONS` array in `SQLLearn.tsx`).
- The sql.js in-browser engine.
- Progress persistence in `localStorage` under `sql_learn_progress`.
- Reset Progress behavior.
- Lesson completion / unlock logic.

## What goes away

- `SolarVillage.tsx` component (no longer rendered).
- Starfield + moonlight glow background styling in `SQLLearn.tsx`.
- The mixed-metaphor look in general.

## Non-goals (out of scope for this redesign)

- Building the second classroom. Scaffolding is set up; actual second subject is a future task.
- Per-lesson URLs.
- User accounts, multi-user progress, sharing of completed work.
- Search across subjects.

## Open questions

- Section title: `Learning`, `School`, `Schoolhouse`, or something else? Default: keep `Learning` since that's the existing route name and the existing Nav label.
- Should the hallway have any ambient audio (echo, distant chatter)? Default: no. The home page has Tetris music and the collection page has KH2 — let learning be quiet.
- Is the chalkboard interactive (Uel "writes" the concept as you arrive) or static? Default: static for v1; can animate later.

## Risks

- **PixelLab asset cost / latency.** Generating multiple poses + backgrounds isn't free and isn't instant. Mitigation: generate once, cache locally in `public/learning/`. Don't generate on every build.
- **Refactor scope.** `SQLLearn.tsx` is ~670 lines with chrome and engine intermingled. Separating them cleanly is more careful work than a quick reskin. Mitigation: extract the layout incrementally, verify each step with the build.
- **Each classroom is now expected to feel like its own world.** That's more design work per subject than the current "drop another route" approach. Acceptable trade-off given the design rule.
