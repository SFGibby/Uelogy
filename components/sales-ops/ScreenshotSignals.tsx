'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Silent signal collector. Nothing visible to the viewer. Fires a quiet
 * beacon to /api/sales-ops/screenshot-signal when we see one of the
 * best-effort proxies for "someone probably grabbed a screenshot."
 *
 * All signals are best-effort — browsers do not expose a real "screenshot
 * taken" event, so these are proxies with known false-positive rates.
 * We log everything and let the Sam-side query filter by signal_type
 * and strength.
 */
type SignalType =
  | 'print_screen_key'      // Windows PrintScreen; ~100% Windows screenshots
  | 'quick_tab_switch'      // visibility hidden < 1.5s then back; ~60% proxy
  | 'focus_return_fast'     // window blur then focus < 2s; same intent
  | 'devtools_open'         // outer-inner width delta jump
  | 'image_right_click'     // contextmenu on <img>; "save image" intent
  | 'copy_image_clipboard'; // clipboard write with image mime

const SIGNAL_COOLDOWN_MS: Record<SignalType, number> = {
  print_screen_key: 2_000,
  quick_tab_switch: 10_000,
  focus_return_fast: 10_000,
  devtools_open: 60_000,
  image_right_click: 5_000,
  copy_image_clipboard: 5_000,
};

export default function ScreenshotSignals() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const lastFired: Partial<Record<SignalType, number>> = {};

    function send(type: SignalType, meta: Record<string, unknown> = {}) {
      const now = Date.now();
      const last = lastFired[type] ?? 0;
      if (now - last < SIGNAL_COOLDOWN_MS[type]) return;
      lastFired[type] = now;
      const payload = JSON.stringify({ path: pathname, signal_type: type, meta, ts: now });
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon('/api/sales-ops/screenshot-signal', blob);
          return;
        }
      } catch { /* fall through */ }
      fetch('/api/sales-ops/screenshot-signal', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => { /* silent */ });
    }

    // --- PrintScreen key — Windows / Linux screenshot shortcut.
    function onKeyDown(e: KeyboardEvent) {
      // The event spec says `PrintScreen` on keyup only; keydown fires on
      // some combinations. Watch both; the cooldown handles the dupe.
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        send('print_screen_key', { shift: e.shiftKey, meta: e.metaKey, ctrl: e.ctrlKey, alt: e.altKey });
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        send('print_screen_key', { shift: e.shiftKey, meta: e.metaKey, ctrl: e.ctrlKey, alt: e.altKey, phase: 'up' });
      }
    }

    // --- Visibility change — classic "took shot, flipped back fast" pattern.
    let hiddenAt: number | null = null;
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (document.visibilityState === 'visible' && hiddenAt != null) {
        const away = Date.now() - hiddenAt;
        if (away < 1500) send('quick_tab_switch', { awayMs: away });
        hiddenAt = null;
      }
    }

    // --- Window blur / focus — overlaps with visibility but catches
    // Spotlight-style capture tools that don't trigger visibility.
    let blurAt: number | null = null;
    function onBlur() { blurAt = Date.now(); }
    function onFocus() {
      if (blurAt != null) {
        const away = Date.now() - blurAt;
        if (away < 2000 && document.visibilityState === 'visible') {
          send('focus_return_fast', { awayMs: away });
        }
        blurAt = null;
      }
    }

    // --- DevTools open — detected via inner/outer size delta jump.
    // Not perfect: docked bottom panels only widen the delta; detached
    // panels don't change it at all. Still catches most "crack open the
    // inspector to copy an element" patterns.
    let devtoolsSuspected = false;
    const DEVTOOLS_THRESHOLD = 160;
    function checkDevtools() {
      const widthGap = Math.abs(window.outerWidth - window.innerWidth);
      const heightGap = Math.abs(window.outerHeight - window.innerHeight);
      const open = widthGap > DEVTOOLS_THRESHOLD || heightGap > DEVTOOLS_THRESHOLD + 40;
      if (open && !devtoolsSuspected) {
        devtoolsSuspected = true;
        send('devtools_open', { widthGap, heightGap });
      } else if (!open) {
        devtoolsSuspected = false;
      }
    }
    const devtoolsTimer = window.setInterval(checkDevtools, 1500);
    checkDevtools();

    // --- Right-click on an <img> — "save image as" intent.
    function onContextMenu(e: MouseEvent) {
      const target = e.target as Element | null;
      if (!target) return;
      if (target.tagName === 'IMG' || target.closest?.('img')) {
        send('image_right_click', { tag: target.tagName });
      }
    }

    // --- Clipboard write with image mime (very narrow on Mac, broad on Win).
    function onCopy() {
      try {
        const items = (navigator as unknown as { clipboard?: { read?: () => Promise<unknown> } }).clipboard;
        if (!items) return;
      } catch { /* ignore */ }
      // Peek at the next clipboard read; if it contains image mime, flag.
      queueMicrotask(async () => {
        try {
          const clip = (navigator as unknown as { clipboard?: { read?: () => Promise<ReadonlyArray<{ types?: string[] }>> } }).clipboard;
          const read = clip?.read;
          if (!read) return;
          const data = await read.call(clip);
          const hasImage = data.some(entry => (entry.types ?? []).some(t => t.startsWith('image/')));
          if (hasImage) send('copy_image_clipboard', {});
        } catch { /* permission denied is the normal path, don't care */ }
      });
    }

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('contextmenu', onContextMenu, true);
    document.addEventListener('copy', onCopy);

    return () => {
      window.clearInterval(devtoolsTimer);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('contextmenu', onContextMenu, true);
      document.removeEventListener('copy', onCopy);
    };
  }, [pathname]);

  return null;
}
