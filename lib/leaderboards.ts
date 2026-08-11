import { supabase } from './supabase';
import type { LeaderboardGame } from './supabase';

export interface TopScore {
  rank: number;
  initials: string;
  score: number;
}

/**
 * One fetch for all games, distributed per-cabinet by the caller.
 * Public SELECT under current RLS. Empty games return an empty array — the caller
 * decides whether to render a fallback table.
 */
export async function fetchAllTopScores(
  limitPerGame = 3
): Promise<Record<LeaderboardGame, TopScore[]>> {
  const empty: Record<LeaderboardGame, TopScore[]> = {
    grid: [],
    tetris: [],
    learning: [],
  };
  try {
    const { data, error } = await supabase
      .from('leaderboards')
      .select('game, player_initials, score')
      .order('score', { ascending: false })
      .limit(200);
    if (error || !data) return empty;
    const groups: Record<LeaderboardGame, TopScore[]> = { grid: [], tetris: [], learning: [] };
    for (const row of data) {
      const g = row.game as LeaderboardGame;
      if (!groups[g]) continue;
      if (groups[g].length >= limitPerGame) continue;
      groups[g].push({
        rank: groups[g].length + 1,
        initials: (row.player_initials || 'AAA').slice(0, 3),
        score: Math.max(0, Math.floor(row.score || 0)),
      });
    }
    return groups;
  } catch {
    return empty;
  }
}

// Fire-and-forget write to the Supabase `leaderboards` table.
// Returns the inserted row (or null) without blocking the UI on failure.
// localStorage stays the primary store; Supabase is the cross-device aggregate.
export async function submitGameScore(
  game: LeaderboardGame,
  initials: string,
  score: number,
  isSam = false
) {
  const safe = (initials.trim() || 'AAA').slice(0, 10).toUpperCase();
  try {
    const { error } = await supabase.from('leaderboards').insert({
      game,
      player_initials: safe,
      score,
      is_sam: isSam,
    });
    if (error) {
      console.warn('leaderboard insert failed:', error.message);
    }
  } catch (e) {
    console.warn('leaderboard insert threw:', e);
  }
}
