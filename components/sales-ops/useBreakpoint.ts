'use client';

import { useEffect, useState } from 'react';

const NARROW_QUERY = '(max-width: 760px)';

/**
 * SSR-safe mobile breakpoint. Returns false on first render (server), then
 * updates once the client mounts and the media query matches.
 */
export function useIsNarrow(): boolean {
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(NARROW_QUERY);
    const update = () => setIsNarrow(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);
  return isNarrow;
}
