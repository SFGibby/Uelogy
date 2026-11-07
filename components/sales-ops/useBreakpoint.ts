'use client';

import { useEffect, useState } from 'react';

const NARROW_QUERY = '(max-width: 760px)';
const TIGHT_QUERY = '(max-width: 980px)';

/**
 * SSR-safe mobile breakpoint. Returns false on first render (server), then
 * updates once the client mounts and the media query matches.
 */
export function useIsNarrow(): boolean {
  return useMediaQuery(NARROW_QUERY);
}

/** Tighter breakpoint for horizontal-nav collisions. */
export function useIsTight(): boolean {
  return useMediaQuery(TIGHT_QUERY);
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);
  return matches;
}
