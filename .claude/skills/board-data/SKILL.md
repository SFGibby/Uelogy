---
name: board-data
description: Use when working on where board/page data comes from, how it loads, saving changes, fetch logic, or fixing a board stuck on "LOADING BOARD...". Trigger on data, fetch, load, save, persist, localStorage, API, async, loading, stuck, hang.
---

# Board data layer

One source of truth for board state; one read path and one write path. Don't scatter fetch calls through components.

## Loading (this is where "LOADING BOARD..." hangs come from)
A permanent loading message means the async flow has no failure exit. Every load must set state to loading, then resolve to exactly one of ready / empty / error:

    async function loadBoard() {
      try {
        const data = await withTimeout(fetchBoard(), 6000); // reject if no response
        return data?.cards?.length ? state('ready', data) : state('empty');
      } catch (err) {
        return state('error', err);   // the missing branch that causes the hang
      }
    }

- Add a timeout so a silent or failed request becomes a visible error instead of an eternal spinner.
- Log the real error to the console so the network tab tells you what broke.

## Writing
- All mutations go through one saveCard / moveCard function, never inline.
- Shared backend: the write is authenticated server-side (see edit-gating). Use optimistic UI — update locally, reconcile with the server response, roll back on failure.
- Personal/offline board: localStorage is fine. Load on mount, write after each mutation, wrap in try/catch.

## Shape on the wire
Persist the same Card / Stage / Type shapes defined in the grid-board skill so the data layer and UI never drift.
