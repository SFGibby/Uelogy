---
title: Q.CELL 405 vs 410 confusion in CA (Aurora shows 410s, sheet says 405)
systems: [Enerflo, Aurora]
category: panels-equipment
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [qcell, 405, 410, california, aurora, modules-by-market]
seen_in: [2026-01-06, 2026-01-07]
---

## Symptom
Rep in CA builds a GoodLeap design in Aurora and only sees the Q.CELL 410 module — but the Modules-by-Market sheet says CA should use Q.CELL 405. Conversely, another rep tries the 405 and Enerflo tells them to use the 410.

## Likely Cause
- Supply chain changes mid-cycle: CA was flipped between 405 and 410 depending on which campaign / financing partner was active. Per CCE 2026-01-07: "Jerry and supply chain have been making changes to equipment. I've asked Jerry to update the models by market sheet so we know what to sell."
- The Aurora library vs Enerflo catalog vs Modules-by-Market sheet can all be out of sync during the swap.
- Per PID 2026-01-06: "Use the 410 qcell module" for the specific CA GoodLeap deal that day.

## Resolution
1. Check the most recent version of the Modules-by-Market sheet for CA (timestamp matters — it changes).
2. If the sheet and Aurora disagree, default to what Aurora + Enerflo will BOTH accept — usually that's the 410 for GoodLeap CA as of 2026-01.
3. If the rep really needs a 405 (for a specific AVL or pricing), ping PID for a catalog check before retrying.
4. Do not coach reps to pick a panel that doesn't appear in their Aurora library — it will just fail again.
5. Escalate to Jerry / supply chain to align the sheet and catalog. <!-- TODO: Sam to confirm current CA panel as of 2026-04 -->

## Related
- `brain/panels-equipment/tpo-approved-panels-by-state.md`
- `brain/panels-equipment/goodleap-430-panel-errors-multi-market.md`
