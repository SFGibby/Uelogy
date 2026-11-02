'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Fires a short-lived POST to /api/sales-ops/pageview on every navigation
 * inside /sales-ops/*. The server captures who (from sales_ops_identity),
 * what (path), where (IP + UA), when (ts) into Supabase so we can trace a
 * screenshot leak back to the viewer. navigator.sendBeacon when available
 * so the request survives tab close.
 */
export default function PageviewBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || typeof window === 'undefined') return;
    const payload = JSON.stringify({ path: pathname, ts: Date.now() });
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/sales-ops/pageview', blob);
        return;
      }
    } catch { /* fall through to fetch */ }
    fetch('/api/sales-ops/pageview', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => { /* silent */ });
  }, [pathname]);

  return null;
}
