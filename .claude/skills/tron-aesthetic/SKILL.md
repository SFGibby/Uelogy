---
name: tron-aesthetic
description: Use whenever building or restyling any page or component on this site (uelogy / Samuel Gibson personal site) — anything touching color, typography, borders, the grid floor, scanlines, or the overall retro Tron look. Trigger on style, theme, CSS, colors, font, glow, neon, retro, 8-bit, Tron, layout.
---

# Tron Aesthetic — site design system

This site is Tron Legacy on a near-black field, not generic neon. Hold the line on these tokens so pages stay coherent.

## Palette (CSS variables — never hardcode hex inline)

    --bg:#05070a; --bg-2:#0a0f16;
    --cyan:#38e1ff;  --cyan-dim:#1b6e82;  --cyan-glow:#aef4ff;     /* Programs / visitor view */
    --orange:#ff8a3c; --orange-dim:#9c4d1d; --orange-glow:#ffd2a8; /* the Grid / admin / edit mode */
    --ink:#cfeefa; --danger:#ff4d4d;

Cyan is the default/visitor accent. Flip the accent to orange in admin/edit mode (?admin=1) so the mode is visible at a glance — do it with one body.admin class that re-points an --accent variable, not by rewriting components.

## Typography
- Headings/labels: Press Start 2P. Small sizes only (9-14px). Never set body copy or numbers in it — unreadable in bulk.
- Body, data, card text: VT323 (readable pixel/terminal face).
- Load both from Google Fonts with preconnect.

## Signature devices
- CRT scanline + vignette overlay: fixed full-screen layer, mix-blend-mode:multiply, faint flicker.
- Perspective grid floor: fixed to the bottom, rotateX(~72deg), slow scroll animation.
- 8-bit segmented bars: build meters from a row of flex .seg divs that toggle an .on class — NOT a smooth gradient fill. Segments are what reads as 8-bit.

## Restraint & quality floor
- One bold signature per page (usually the grid floor). Keep everything else quiet.
- Always ship: visible keyboard focus (:focus-visible), responsive to mobile, and @media (prefers-reduced-motion:reduce) that disables the flicker and grid flow.
- Vocabulary: people are Users, automated/owned things are Programs. Keep that in UI labels.
