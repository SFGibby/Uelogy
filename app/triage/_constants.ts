// Named constants for the /triage page + widget. Keep this file as the one
// place where timings, sizes, and layout numbers live — grep-and-change in
// one spot instead of hunting across components.

export const TIMING = {
  /** 90 seconds before the escalated session offers an email-fallback. */
  takeoverMs: 90_000,
  /** Minimum display time for the "Helios thinking…" indicator. */
  minThinkingMs: 700,
  /** How long the "Resolved. Pick a new lane when ready." toast hangs. */
  resolvedToastMs: 1_200,
  /** Delay before focusing the input after picking a lane. */
  inputFocusMs: 150,
  /** Delay before scrolling the chat panel into view after startSession. */
  scrollIntoViewMs: 30,
  /** Groq backoff on transient 503s before a single retry. */
  groqRetryBackoffMs: 200,
} as const;

export const LAYOUT = {
  chatMinHeight: 320,
  chatMaxHeight: 520,
  messageMaxWidthPct: 82,
} as const;

/** Debug-log gate. Toggle via `localStorage.setItem('heliosDebug', '1')`. */
export function debugLog(
  tag: string,
  msg: string,
  data?: Record<string, unknown>
) {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage.getItem('heliosDebug') !== '1') return;
    // eslint-disable-next-line no-console
    console.debug(`[helios:${tag}]`, msg, data ?? '');
  } catch {
    /* ignore */
  }
}
