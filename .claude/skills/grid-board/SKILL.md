---
name: grid-board
description: Use when building, fixing, or extending THE GRID page — the project board with stages on the x-axis, colored type tags, and drag-to-move cards. Trigger on board, kanban, grid, stages, columns, cards, tasks, drag, drop, move, project board.
---

# The Grid — project board UI

The Grid is a kanban-style board: stages run left-to-right (x-axis columns), each card carries a type shown as a colored tag, and cards move between stages.

## Data model (single shape, used everywhere)

    Card  = { id: string; title: string; type: string; stage: string; order: number }
    Stage = { id: string; label: string }                       // ordered, defines columns L to R
    Type  = { id: string; label: string; color: string }        // drives tag color

Stages and types are config, not hardcoded in JSX. Adding a stage = adding to the array.

## Interactions
- Drag to move between stages — but drag alone excludes keyboard and touch users. Always pair it with left/right move controls on each card so the board is operable without a mouse. Hard requirement.
- Reordering within a stage updates order; persist the change (see board-data skill).
- Cards are editable only in admin/edit mode (see edit-gating skill); visitors get a read-only board.

## States the board MUST render explicitly
A board that can only show "loaded" is broken. Handle all four:
1. Loading — brief, with a timeout. If data has not resolved in a few seconds, fall through to error. Never leave a permanent "LOADING BOARD...".
2. Error — say what failed and how to retry, in the interface's voice (no apologies, no vagueness).
3. Empty board — an invitation to add the first card, not a blank rectangle.
4. Empty stage — a quiet placeholder so the column reads as intentionally empty.

## Styling
Inherit everything from the tron-aesthetic skill. Type tags use the type's color. Columns get a dim accent border; the active drag target highlights with the full accent + glow.
