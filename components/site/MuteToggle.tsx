'use client';

// Single global mute state, persisted to localStorage as 'muteAll' = '1'|'0'.
// Other audio sources subscribe via useMute() and stop playing when muted.
// Uses useSyncExternalStore so the subscription doesn't trigger lint warnings
// about setState-in-effect, and is consistent across React 19 transitions.

import { useCallback, useSyncExternalStore } from 'react';

const KEY = 'muteAll';
const EVENT = 'mute-change';

function read(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function broadcast(muted: boolean) {
  try {
    localStorage.setItem(KEY, muted ? '1' : '0');
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<boolean>(EVENT, { detail: muted }));
  }
}

function subscribe(notify: () => void) {
  window.addEventListener(EVENT, notify);
  window.addEventListener('storage', notify);
  return () => {
    window.removeEventListener(EVENT, notify);
    window.removeEventListener('storage', notify);
  };
}

export function useMute(): [boolean, (next?: boolean) => void] {
  const muted = useSyncExternalStore(
    subscribe,
    () => read(),
    () => false
  );

  const toggle = useCallback((next?: boolean) => {
    const v = typeof next === 'boolean' ? next : !read();
    broadcast(v);
  }, []);

  return [muted, toggle];
}

interface Props {
  accent?: string;
  bottom?: number;
  left?: number;
}

export default function MuteToggle({
  accent = '#33ff33',
  bottom = 20,
  left = 20,
}: Props) {
  const [muted, toggle] = useMute();
  return (
    <button
      type="button"
      onClick={() => toggle()}
      aria-label={muted ? 'Unmute' : 'Mute'}
      title={muted ? 'Unmute' : 'Mute'}
      style={{
        position: 'fixed',
        bottom,
        left,
        zIndex: 50,
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: muted ? 'rgba(0,0,0,0.6)' : `${accent}1a`,
        border: `1px solid ${muted ? `${accent}33` : `${accent}80`}`,
        color: muted ? `${accent}66` : accent,
        fontSize: 18,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        fontFamily: 'inherit',
      }}
    >
      {muted ? '♪̸' : '♪'}
    </button>
  );
}
