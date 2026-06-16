'use client';

// Return-to-Sam's affordance, one per leaf page.
// Same anchor across the site (top-left, ≥44×44) so it's always findable,
// but styled to each page's world via the `variant` prop.

import Link from 'next/link';

type Variant =
  | 'bell'        // /learning — schoolhouse bell
  | 'exit-sign'   // /collection — gallery exit
  | 'garden-gate' // /ledger — Secret Garden
  | 'clipboard'   // /triage — work clipboard
  | 'kanban-exit'; // /grid — Tron-style exit (currently used inline by GridKanbanView)

interface Props {
  variant: Variant;
  href?: string;
  label?: string;
}

const STYLES: Record<Variant, { bg: string; border: string; color: string; glyph: string; font: string }> = {
  bell: {
    bg: 'rgba(245, 230, 200, 0.92)',
    border: '#7a5a2a',
    color: '#3a2810',
    glyph: '🛎',
    font: 'Georgia, "Iowan Old Style", serif',
  },
  'exit-sign': {
    bg: 'rgba(20, 8, 20, 0.85)',
    border: 'rgba(167, 139, 250, 0.6)',
    color: '#e0d2ff',
    glyph: 'EXIT',
    font: 'system-ui, sans-serif',
  },
  'garden-gate': {
    bg: 'rgba(245, 236, 211, 0.94)',
    border: '#6b8e4e',
    color: '#1f3422',
    glyph: '✦',
    font: '"Cardo", Georgia, serif',
  },
  clipboard: {
    bg: 'rgba(5, 7, 12, 0.85)',
    border: 'rgba(0, 86, 184, 0.6)',
    color: '#a8c4e8',
    glyph: '◀',
    font: 'system-ui, sans-serif',
  },
  'kanban-exit': {
    bg: 'rgba(0, 0, 0, 0.65)',
    border: 'rgba(0, 240, 255, 0.55)',
    color: '#00f0ff',
    glyph: '◀',
    font: 'ui-monospace, monospace',
  },
};

export default function ReturnHome({
  variant,
  href = '/',
  label = "Sam's",
}: Props) {
  const s = STYLES[variant];
  return (
    <Link
      href={href}
      aria-label={`Return to ${label}`}
      title={`Return to ${label}`}
      style={{
        position: 'fixed',
        top: 16,
        left: 16,
        zIndex: 100,
        minWidth: 44,
        minHeight: 44,
        padding: '8px 14px',
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        fontFamily: s.font,
        fontSize: 13,
        letterSpacing: '0.06em',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
      }}
    >
      <span aria-hidden style={{ fontSize: variant === 'exit-sign' ? 11 : 16, fontWeight: 700 }}>
        {s.glyph}
      </span>
      <span>← {label}</span>
    </Link>
  );
}
