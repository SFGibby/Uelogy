---
title: FL and SC deals error "no equipment available" (Enerflo market catalog empty)
systems: [Enerflo]
category: panels-equipment
owner: <!-- TODO: Sam to fill -->
escalate_to: <!-- TODO: Sam to fill -->
tags: [florida, south-carolina, equipment-check, empty-catalog, modules-by-market]
seen_in: [2026-02-13, 2026-02-16, 2026-02-17]
---

## Symptom
Rep opens a FL or SC deal in Enerflo and sees no panel options at all on the equipment-check or design stage. Error message varies but reps cannot build any proposal. Affected reps over multiple days with customer callbacks rescheduled 4x in one case.

## Likely Cause
- Supply chain did not yet activate equipment in Enerflo for FL / SC, even though zip-code approvals existed. Per CCE 2026-02-16: "I'm not seeing any equipment available in SC. I'll reach out to supply chain." Per CCE 2026-02-17: "Qcells have been activated in SC and FL" — the fix was explicit supply-chain activation.
- The Supply Chain modules-by-market sheet was missing FL equipment entirely at the time (per CCE 2026-02-13: "Supply chain's sheet doesn't have equipment").

## Resolution
1. If a rep reports no panels showing in a state, first check whether the state is newly-activated for sales (zip approval doesn't equal equipment activation).
2. Ping CCE / supply chain to confirm Q.CELL (or market-appropriate panels) are enabled for that state in Enerflo.
3. Do NOT tell the rep the state is broken — tell them panels are pending activation and to reschedule. Supply chain can enable within hours if pushed.
4. Once activated, have the rep re-open the deal — the catalog update is immediate, no design rebuild needed.
5. Escalate to supply chain. <!-- TODO: Sam to confirm the current FL / SC panel activation status -->

## Related
- `brain/panels-equipment/tpo-approved-panels-by-state.md`
- `brain/panels-equipment/mn-seg440-panel-required.md`
