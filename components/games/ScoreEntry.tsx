'use client';

// Shared end-of-game initials+score panel.
// Renders the "Sam had {samScore + 10} — try again." UI fiction when the player
// fell short of Sam's stored top score. The fiction never modifies what's persisted —
// submitGameScore always writes the player's true score.

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { submitGameScore } from '../../lib/leaderboards';
import type { LeaderboardGame } from '../../lib/supabase';

interface Props {
  game: LeaderboardGame;
  score: number;
  onDone: () => void;
  accent?: string;
  dim?: string;
  font?: string;
  defaultInitials?: string;
}

export default function ScoreEntry({
  game,
  score,
  onDone,
  accent = '#33ff33',
  dim = '#1aaa1a',
  font = 'var(--font-vt323), monospace',
  defaultInitials = '',
}: Props) {
  const [initials, setInitials] = useState(defaultInitials);
  const [samScore, setSamScore] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('leaderboards')
        .select('score')
        .eq('game', game)
        .eq('is_sam', true)
        .order('score', { ascending: false })
        .limit(1);
      if (cancelled) return;
      setSamScore((data?.[0]?.score as number | undefined) ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [game]);

  const shortfall = samScore != null && score < samScore;

  async function handleSave() {
    if (busy) return;
    setBusy(true);
    await submitGameScore(game, initials, score);
    onDone();
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        fontFamily: font,
        color: accent,
        padding: 16,
      }}
    >
      <div style={{ letterSpacing: '0.3em' }}>GAME OVER</div>
      <div style={{ fontSize: 28 }}>SCORE: {score.toLocaleString()}</div>

      {shortfall && (
        <div
          style={{
            color: dim,
            fontStyle: 'italic',
            fontSize: 14,
            maxWidth: 280,
            textAlign: 'center',
          }}
        >
          Sam had {(samScore! + 10).toLocaleString()}. Try again.
        </div>
      )}

      <div style={{ color: dim, fontSize: 14 }}>ENTER YOUR NAME:</div>
      <input
        autoFocus
        value={initials}
        onChange={(e) => setInitials(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void handleSave();
        }}
        maxLength={10}
        style={{
          background: '#000',
          border: `1px solid ${accent}`,
          color: accent,
          padding: '6px 12px',
          textAlign: 'center',
          width: 160,
          outline: 'none',
          fontFamily: font,
          fontSize: 20,
          caretColor: accent,
        }}
        placeholder="_ _ _ _ _"
      />
      <button
        onClick={handleSave}
        disabled={busy}
        style={{
          border: `1px solid ${accent}`,
          color: accent,
          background: 'transparent',
          padding: '6px 28px',
          fontFamily: font,
          cursor: busy ? 'not-allowed' : 'pointer',
          fontSize: 16,
          minHeight: 44,
        }}
      >
        {busy ? 'SAVING…' : 'SAVE'}
      </button>
      <button
        onClick={onDone}
        style={{
          color: dim,
          background: 'transparent',
          border: 'none',
          fontFamily: font,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        SKIP
      </button>
    </div>
  );
}
