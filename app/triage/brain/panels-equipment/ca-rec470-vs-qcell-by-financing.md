---
title: CA panel selection depends on financing: REC 470 for cash/loan, Q.CELL for TPO
systems: [Enerflo, Aurora, LightReach, GoodLeap, Palmetto]
category: panels-equipment
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [california, rec-470, qcell, rec-450, cash, loan, tpo, domestic-content]
seen_in: [2026-02-03, 2026-02-04, 2026-02-05, 2026-02-11]
---

## Symptom
Rep picks REC 470 in CA and Enerflo blocks LightReach TPO. Or picks Q.CELL 410 for cash/loan and Enerflo errors. Reps are confused which panel is valid for which financing.

## Likely Cause
- Policy per PID 2026-02-03: "In CA use the REC470, we were told to turn off REC450 in CA" — REC 470 is the cash/loan default in CA.
- For TPO (LightReach, GoodLeap), Q.CELL is the required panel because LR needs DC panels (per PID 2026-01-26).
- There was an active internal debate (per CCE 2026-02-05) about whether REC 470 could be allowed on LR (Devon, Eric, Conner were deciding) — as of mid-Feb 2026 the answer was "use domestic content / Q.CELL for LR, REC 470 for cash/loan only".
- Per CCE 2026-02-05: if a rep hit a module error with 470 + LightReach, switching to domestic content (Q.CELL) cleared it.

## Resolution
1. Ask the rep: what financing is the customer going with?
   - Cash or loan → REC 470 (domestic content path).
   - LightReach TPO → Q.CELL 410 (or whatever the current DC/DOM panel is).
   - GoodLeap TPO → check AVL; IQ8X inverter is NOT on GoodLeap DOM AVL so if paired with 470s it may still error.
2. If the rep started the design on the wrong panel, have them swap in Aurora, re-sync to Enerflo, and regenerate the proposal.
3. Do NOT tell reps they can show both panels interchangeably — panel selection is financing-scoped.
4. Escalate if the current panel-by-financing policy has changed. <!-- TODO: Sam to confirm current CA cash/loan default panel as of 2026-04 -->

## Related
- `brain/panels-equipment/tpo-approved-panels-by-state.md`
- `brain/panels-equipment/qcell-405-vs-410-ca.md`
- `brain/panels-equipment/goodleap-430-panel-errors-multi-market.md`
