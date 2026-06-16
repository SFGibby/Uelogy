'use client';

// Top-10 leaderboard for a given game. Pure read from Supabase, truthful display.
// Used wherever the "real" standings are shown (cabinet scoreboard, after-game review).

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Leaderboard as LeaderboardRow, LeaderboardGame } from '../../lib/supabase';

interface Props {
  game: LeaderboardGame;
  accent?: string;
  dim?: string;
  font?: string;
}

export default function Leaderboard({
  game,
  accent = '#33ff33',
  dim = '#1aaa1a',
  font = 'var(--font-vt323), monospace',
}: Props) {
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('leaderboards')
        .select('*')
        .eq('game', game)
        .order('score', { ascending: false })
        .limit(10);
      if (cancelled) return;
      if (error) setError(error.message);
      setRows((data as LeaderboardRow[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [game]);

  if (rows === null) {
    return (
      <div style={{ color: dim, fontFamily: font, fontSize: 14 }}>LOADING…</div>
    );
  }
  if (error) {
    return (
      <div style={{ color: '#ff5050', fontFamily: font, fontSize: 13 }}>
        ERR: {error}
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div style={{ color: dim, fontFamily: font, fontSize: 14 }}>
        NO SCORES YET. BE THE FIRST.
      </div>
    );
  }
  return (
    <div style={{ width: '100%', fontFamily: font }}>
      <div style={{ marginBottom: 8, color: accent, letterSpacing: '0.18em' }}>
        — TOP 10 —
      </div>
      {rows.map((r, i) => (
        <div
          key={r.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            padding: '2px 0',
            color: r.is_sam ? accent : dim,
            fontWeight: r.is_sam ? 700 : 400,
          }}
        >
          <span style={{ width: 24, color: dim }}>{i + 1}.</span>
          <span style={{ flex: 1 }}>{r.player_initials}</span>
          <span>{r.score.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
