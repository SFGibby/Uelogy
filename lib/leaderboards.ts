import { supabase } from './supabase';
import type { LeaderboardGame } from './supabase';

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
